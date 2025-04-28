import * as fs from 'fs'
import * as path from 'path'

/**
 * check whether the filename could be a vrchat file
 * @param filename filename of a file
 * @returns whether the file could be a vrchat log file.
 */
export const isVrchatLogFile = (filename: string) =>
  filename.startsWith('output_log_')

/**
 * get the latest log file path from vrchat folder
 * @param logDir dir with vrchat log files
 * @returns the latest logfile path if found
 */
export const getLatestLogfile = (logDir: string) => {
  const logFiles = fs
    .readdirSync(logDir)
    .filter((x) => isVrchatLogFile(x))
    .map((x) => ({
      filename: x,
      createdAt: fs.statSync(path.join(logDir, x)).ctime.getTime(),
    }))
    .sort((a, b) => b.createdAt - a.createdAt)

  if (logFiles.length === 0) {
    return null
  }
  return path.join(logDir, logFiles[0].filename)
}
