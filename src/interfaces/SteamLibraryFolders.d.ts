export interface SteamLibraryFolders {
  libraryfolders: { [key: string]: LibraryFolder }
}

export interface LibraryFolder {
  path: string
  label: string
  contentid: number
  totalsize: number
  update_clean_bytes_tally: number
  time_last_update_verified: number
  apps: { [key: string]: number }
}
