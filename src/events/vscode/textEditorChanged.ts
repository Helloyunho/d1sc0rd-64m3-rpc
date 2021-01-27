import { TextEditor } from 'vscode'
import { rpc } from '../../consts'

export default async function textEditorChanged(
  textEditor: TextEditor | undefined
): Promise<void> {
  await rpc.fileChanged(textEditor?.document)
}
