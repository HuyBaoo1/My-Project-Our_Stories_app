import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const mode = process.argv[2]
if (!['rules', 'start'].includes(mode)) throw new Error('Expected rules or start.')

// Firebase CLI debug logging can include its child process environment. Pass only
// local runtime necessities, never cloud tokens, production config or parent DEBUG.
const allowed = new Set([
  'path', 'systemroot', 'windir', 'temp', 'tmp', 'userprofile', 'appdata',
  'localappdata', 'programdata', 'homedrive', 'homepath', 'comspec', 'pathext',
  'programfiles', 'programfiles(x86)', 'commonprogramfiles', 'java_home',
  'lang', 'lc_all', 'term',
])
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.has(key.toLowerCase())))
env.FIREBASE_CLI_DISABLE_MOTD = 'true'
env.FIREBASE_CLI_DISABLE_USAGE = 'true'
const args = mode === 'rules'
  ? ['emulators:exec', '--only', 'firestore', '--project', 'demo-our-stories', '--non-interactive', '--log-verbosity', 'QUIET', 'vitest run --project rules']
  : ['emulators:start', '--only', 'auth,firestore,hosting', '--project', 'demo-our-stories', '--log-verbosity', 'INFO']
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/firebase-tools/lib/bin/firebase.js', import.meta.url)), ...args], {
  cwd: fileURLToPath(new URL('../', import.meta.url)), env, stdio: 'inherit', windowsHide: true,
})
child.on('error', () => { process.stderr.write('Could not start local Firebase Emulator.\n'); process.exitCode = 1 })
child.on('exit', (code) => { process.exitCode = code ?? 1 })
