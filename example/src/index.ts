import { homedir } from 'os'
import { VrchatLogWatcher } from 'vrchat-log-watcher'

const log = new VrchatLogWatcher()

// // log all messages
// log.on('raw', console.log)

// // log all debug messages
// log.on('debug', console.log)

// // log all debug messages with the topic API
// log.on('debug', (data) => {
//   if(data.topic == 'API')
//     console.log(data)
// })

// // log all error messages
// log.on('err', console.error)

log.on('imageLoad', console.log)
log.on('stringLoad', console.log)
