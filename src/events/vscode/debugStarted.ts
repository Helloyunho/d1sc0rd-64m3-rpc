import { DebugSession } from 'vscode'
import { rpc } from '../../consts'

export default async function debugStarted(_: DebugSession): Promise<void> {
  await rpc.debugStateChanged(true)
}
