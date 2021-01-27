import { DebugSession } from 'vscode'
import { rpc } from '../../consts'

export default async function debugStopped(_: DebugSession): Promise<void> {
  await rpc.debugStateChanged(false)
}
