import { exec } from 'child_process'
import os from 'os'
const backendCommand = 'npm run dev'
const platform = os.platform()

try {
  if (platform === 'win32') {
    // Spustenie backendu vo Windowse
    exec(`start powershell.exe -NoExit ${backendCommand}`)
  } else if (platform === 'darwin') {
    // Spustenie backendu na macOS (Mac OS X)
    exec(`open -a Terminal.app ${backendCommand}`)
  } else {
    // Spustenie backendu na Linux a ostatných OS
    exec(`x-terminal-emulator -e ${backendCommand}`)
  }

  console.log('Backend sa spustil.')
} catch (error) {
  console.error('Chyba pri spúšťaní backendu:', error.message)
}
