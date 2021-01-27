import { TextDocument } from 'vscode'
import { rpc } from '../../consts'

export default async function closedTextDocument(
  _: TextDocument
): Promise<void> {
  console.log('closed')
  await rpc.fileChanged(undefined)
}
