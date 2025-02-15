import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { Tail } from 'tail'
import { EventEmitter } from 'events'
import {
  VrchatLogWatcherEventData,
  VrchatLogWatcherEventDataWithTopic,
} from './interfaces/VrchatLogWatcherEventData'

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
}

export class VrchatLogWatcher extends EventEmitter {
  // regex to parse the content of a line
  public static lineRegex =
    /^(?<date>\d{4}\.\d{2}\.\d{2} \d{2}\:\d{2}\:\d{2}) (?<type>[a-zA-Z]+) +-  (?<data>.*)$/

  // regex to parse data from a line
  public static lineDataRegex = /^\[(?<topic>[a-zA-Z0-9]+)\] (?<content>.*)$/

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
    this.vrchatLogDir = path.join(
      os.homedir(),
      'Appdata',
      'LocalLow',
      'VRChat',
      'VRChat',
    )

    // start logging on init
    this.currentLogFile = this.getLatestLogfile()
    this.watchFile()

    // watch new files in the loggin folder
    fs.watch(this.vrchatLogDir, (event, filename) => {
      // file created, renamed or deleted
      if (!filename || event !== 'rename') {
        return
      }
      // is vrchat logfile
      if (!this.isVrchatLogFile(filename)) {
        return
      }
      const newLogFile = this.getLatestLogfile()
      // is same logfile that current
      if (newLogFile === this.currentLogFile) {
        return
      }
      this.currentLogFile = newLogFile
      this.watchFile()
    })
  }

  /**
   * check whether the filename could be a vrchat file
   * @param filename filename of a file
   * @returns whether the file could be a vrchat log file.
   */
  private isVrchatLogFile = (filename: string) =>
    filename.startsWith('output_log_')

  /**
   * get the latest log file path from vrchat folder
   * @returns the latest logfile path if found
   */
  private getLatestLogfile = () => {
    const logFiles = fs
      .readdirSync(this.vrchatLogDir)
      .filter((x) => this.isVrchatLogFile(x))
      .map((x) => ({
        filename: x,
        createdAt: fs.statSync(path.join(this.vrchatLogDir, x)).ctime.getTime(),
      }))
      .sort((a, b) => b.createdAt - a.createdAt)

    if (logFiles.length === 0) {
      return null
    }
    return path.join(this.vrchatLogDir, logFiles[0].filename)
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
      return
    }
    this.emit('data', data)
    this.emit(data.type, data)
  }
}
