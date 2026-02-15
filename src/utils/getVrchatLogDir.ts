import * as path from 'path'
import * as os from 'os'
import * as VDF from 'vdf-parser'
import * as fs from 'fs'
import { SteamLibraryFolders } from '../interfaces/SteamLibraryFolders'

// https://steamdb.info/app/438100
const VRCHAT_APP_ID = '438100'

const returnPathIfExists = (path2Check: string) =>
  fs.existsSync(path2Check) ? path2Check : null

export const getVrchatLogDir = () => {
  // windows
  if (process.platform == 'win32') {
    return returnPathIfExists(
      path.join(os.homedir(), 'Appdata', 'LocalLow', 'VRChat', 'VRChat'),
    )
  }

  // linux
  if (process.platform == 'linux') {
    // path of libraryfolders.vdf
    const libraryFoldersPath = path.join(
      os.homedir(),
      '.steam',
      'steam',
      'steamapps',
      'libraryfolders.vdf',
    )

    // return if file is non existant
    if (!fs.existsSync(libraryFoldersPath)) {
      return null
    }

    // read and parse file
    const libraryFoldersText = fs.readFileSync(libraryFoldersPath).toString()
    const libraryFoldersConfig =
      VDF.parse<SteamLibraryFolders>(libraryFoldersText)

    console.log(libraryFoldersConfig.libraryfolders)

    // find library with vrchat
    const library = Object.values(libraryFoldersConfig.libraryfolders).findLast(
      (library) =>
        // returns app id or undefined
        Object.keys(library.apps).findLast((appId) => appId == VRCHAT_APP_ID),
    )

    // check if library with VRChat is existent
    if (!library?.path) {
      return null
    }

    return returnPathIfExists(
      path.join(
        library.path,
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
      ),
    )
  }

  return null
}
