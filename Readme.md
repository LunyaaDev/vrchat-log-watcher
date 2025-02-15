# vrchat-log-watcher

A Node.js package to watch and parse VRChat log files in real-time.

## Features
- Watches VRChat log files
- Parses log messages into structured data

## Installation

```sh
npm install vrchat-log-watcher
```

or with pnpm:

```sh
pnpm add vrchat-log-watcher
```

## Usage

```ts
import { VrchatLogWatcher } from "vrchat-log-watcher"

const log = new VrchatLogWatcher()

// Log all messages
log.on('raw', console.log)

// Log all debug messages
log.on('debug', console.log)

// Log all debug messages with the topic API
log.on('debug', (data) => {
  if (data.topic == 'API')
    console.log(data)
})
```

## Events

| event | description |
| --- | --- | 
| raw | All VRChat logs without any parsing | 
| data | all debug / warning / error events | 
| debug | debug events | 
| warning | warning events | 
| err | error events | 
| stringLoad | stringLoad events | 
| imageLoad | imageLoad events | 
| join | join instance | 
| leave | leave instance | 
| playerJoined | player joined instance | 
| playerLeft | player left instance | 

## Log Format & Parsing

Example log message:
```
2025.02.15 02:12:56 Debug      -  [API] Requesting [...]
```
resolves to: 
```json
{
  "date": new Date("2025.02.15 02:12:56"),
  "type": "debug",
  "data": "[API] Requesting [...]",
  "topic": "API",
  "content": "Requesting [...]"
}
```
topic and content might not be set depending on the log message


## Contributing
Pull requests are welcome! If you have any ideas, feel free to open an issue.

