import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { Tail } from 'tail'
import { EventEmitter } from 'events'
import {
  VrchatLogWatcherEventData,
  VrchatLogWatcherEventDataWithTopic,
} from './interfaces/VrchatLogWatcherEventData'
import {
  Instance as VrchatInstance,
  parseLocation,
} from 'vrchat-location-parser'
import { getVrchatLogDir } from './utils/getVrchatLogDir'
import { getLatestLogfile, isVrchatLogFile } from './utils/getLatestLogfile'

export * from './interfaces/VrchatLogWatcherEventData'

/**
 * Log parser events
 */
export interface VrchatLogWatcherEvents {
  raw: (raw: string) => void
  data: (data: VrchatLogWatcherEventData) => void
  debug: (data: VrchatLogWatcherEventData) => void
  warning: (data: VrchatLogWatcherEventData) => void
  err: (data: VrchatLogWatcherEventData) => void
  stringLoad: (data: VrchatLogWatcherEventData & { url: string }) => void
  imageLoad: (data: VrchatLogWatcherEventData & { url: string }) => void
  join: (
    data: VrchatLogWatcherEventData & { instance: null | VrchatInstance },
  ) => void
  leave: (data: VrchatLogWatcherEventData) => void
  playerJoined: (
    data: VrchatLogWatcherEventData & {
      user: { username: string; userId?: string }
    },
  ) => void
  playerLeft: (
    data: VrchatLogWatcherEventData & {
      user: { username: string; userId?: string }
    },
  ) => void
}

export class VrchatLogWatcher extends EventEmitter {
  // regex to parse the content of a line
  public static lineRegex =
    /^(?<date>\d{4}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2}) (?<type>[a-zA-Z]+) +-  (?<data>.*)$/

  // regex to parse data from a line
  public static lineDataRegex = /^\[(?<topic>[a-zA-Z0-9 ]+)\] (?<content>.*)$/

  private vrchatLogDir: string
  private currentLogFile: null | string = null
  private tail: null | Tail = null

  // overwrite `on` function to add types
  on<K extends keyof VrchatLogWatcherEvents>(
    event: K,
    listener: VrchatLogWatcherEvents[K],
  ): this {
    return super.on(event as string, listener)
  }

  // overwrite `once` function to add types
  once<K extends keyof VrchatLogWatcherEvents>(
    event: K,
    listener: VrchatLogWatcherEvents[K],
  ): this {
    return super.on(event as string, listener)
  }

  // overwrite `emit` function to add types
  emit<K extends keyof VrchatLogWatcherEvents>(
    event: K,
    ...args: Parameters<VrchatLogWatcherEvents[K]>
  ): boolean {
    return super.emit(event as string, ...args)
  }

  constructor() {
    super()
    this.vrchatLogDir = getVrchatLogDir()
    // start logging on init
    this.currentLogFile = getLatestLogfile(this.vrchatLogDir)
    this.watchFile()

    // watch new files in the loggin folder
    fs.watch(this.vrchatLogDir, (event, filename) => {
      // file created, renamed or deleted
      if (!filename || event !== 'rename') {
        return
      }
      // is vrchat logfile
      if (!isVrchatLogFile(filename)) {
        return
      }
      const newLogFile = getLatestLogfile(this.vrchatLogDir)
      // is same logfile that current
      if (newLogFile === this.currentLogFile) {
        return
      }
      this.currentLogFile = newLogFile
      this.watchFile()
    })
  }

  /**
   * Watches the current file
   */
  private watchFile = () => {
    // reset current tail
    if (this.tail) {
      this.tail.unwatch()
      this.tail = null
    }

    // no current log file
    if (!this.currentLogFile) {
      return
    }

    // start reading logs
    this.tail = new Tail(this.currentLogFile, { fromBeginning: false })
    this.tail.on('line', (data) => {
      this.emit('raw', data)
      this.parseLine(data)
    })
    this.tail.on('error', (error) => {
      this.tail?.unwatch()
    })
  }

  /**
   * Tries to parse the vrchat log line and called corresponding events
   * @param line vrchat log line
   */
  private parseLine = (line: string) => {
    // get date, type and data
    const regexResLine = line.match(VrchatLogWatcher.lineRegex)

    // if they dont exist exit
    if (
      !regexResLine ||
      !regexResLine.groups ||
      !regexResLine.groups.date ||
      !regexResLine.groups.type ||
      !regexResLine.groups.data
    ) {
      return
    }

    let type = regexResLine.groups.type.toLocaleLowerCase()
    if (type == 'error') {
      type = 'err'
    }

    // create message
    const data = {
      date: new Date(regexResLine.groups.date),
      type: <VrchatLogWatcherEventData['type']>type,
      data: regexResLine.groups.data.trim(),
    }

    // try to parse data
    const regexResMsg = data.data.match(VrchatLogWatcher.lineDataRegex)

    // and emit the corresponding event
    if (
      regexResMsg &&
      regexResMsg.groups &&
      regexResMsg.groups.topic &&
      regexResMsg.groups.content
    ) {
      const dataWithTopic: VrchatLogWatcherEventDataWithTopic = {
        ...data,
        topic: regexResMsg.groups.topic,
        content: regexResMsg.groups.content,
      }

      this.emit('data', dataWithTopic)
      this.emit(data.type, dataWithTopic)
      this.parseSpecialEvents(dataWithTopic)
      return
    }
    this.emit('data', data)
    this.emit(data.type, data)
    this.parseSpecialEvents(data)
  }

  /**
   * parse spechial events and emit the corresponding trigger
   * @param data parsed watcher event data
   * @returns
   */
  private parseSpecialEvents = (data: VrchatLogWatcherEventData) => {
    // String Download / Image Download
    if (
      data.type == 'debug' &&
      (data.topic == 'String Download' || data.topic == 'Image Download')
    ) {
      // find url in content
      const regexRes = data.content.match(
        /Attempting to load (image|String) from URL '(?<url>[^']+)'/,
      )

      // if url found emit event
      if (regexRes && regexRes.groups && regexRes.groups.url) {
        const eventname =
          data.topic == 'String Download' ? 'stringLoad' : 'imageLoad'

        this.emit(eventname, {
          ...data,
          url: regexRes.groups.url,
        })
        return
      }
    }

    // world join
    if (
      data.type == 'debug' &&
      data.topic == 'Behaviour' &&
      data.content.startsWith('Joining wrld_')
    ) {
      this.emit('join', {
        ...data,
        instance: parseLocation(data.content.substring('Joining '.length)),
      })
      return
    }

    // world leave
    if (
      data.type == 'debug' &&
      data.topic == 'Behaviour' &&
      data.content == 'Unloading scenes'
    ) {
      this.emit('leave', data)
      return
    }

    // player join / leave
    if (
      data.type == 'debug' &&
      data.topic == 'Behaviour' &&
      (data.content.startsWith('OnPlayerJoined ') ||
        data.content.startsWith('OnPlayerLeft '))
    ) {
      // is join or leave event
      const eventname = data.content.startsWith('OnPlayerJoined ')
        ? 'playerJoined'
        : 'playerLeft'

      // find user infos in context
      const regexRes = data.content.match(
        /OnPlayer(Joined|Left) (?<username>[^(]+) (\((?<userId>[^)]+)\))?/,
      )

      if (regexRes?.groups?.username) {
        // has user id
        if (regexRes?.groups?.userId)
          this.emit(eventname, {
            ...data,
            user: {
              username: regexRes.groups.username,
              userId: regexRes.groups.userId,
            },
          })
        // has no user id
        else
          this.emit(eventname, {
            ...data,
            user: {
              username: regexRes.groups.username,
            },
          })
        return
      }
    }
  }
}
