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


# Planned features
- Parse more specific events like:
  - World join / leave
  - Player join / leave
  - String / Image loading
  - ...

## Contributing
Pull requests are welcome! If you have any ideas, feel free to open an issue.

