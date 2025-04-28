import * as path from 'path'
import * as os from 'os'

export const getVrchatLogDir = () => {
  // windows
  if (process.platform == 'win32')
    return path.join(os.homedir(), 'Appdata', 'LocalLow', 'VRChat', 'VRChat')
  return path.join(
    os.homedir(),
    '.steam',
    'steam',
    'steamapps',
    'compatdata',
    '438100',
    'pfx',
    'drive_c',
    'users',
    'steamuser',
    'AppData',
    'LocalLow',
    'VRChat',
    'VRChat',
  )
}
