/**
 * Event data of a log parser event without topic and content
 */
export interface VrchatLogWatcherEventDataWithoutTopic {
  date: Date
  type: 'debug' | 'warning' | 'err'
  data: string
  topic?: undefined
  content?: undefined
}


/**
 * Event data of a log parser event with topic and content
 */
export interface VrchatLogWatcherEventDataWithTopic {
  date: Date
  type: 'debug' | 'warning' | 'err'
  data: string
  topic: string
  content: string
}

/**
 * Event data of a log parser event
 */
export type VrchatLogWatcherEventData =
  | VrchatLogWatcherEventDataWithTopic
  | VrchatLogWatcherEventDataWithoutTopic