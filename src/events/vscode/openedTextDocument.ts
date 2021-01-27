import { TextDocument } from 'vscode'
import { rpc } from '../../consts'

export default async function openedTextDocument(
  document: TextDocument
): Promise<void> {
  if (rpc.lang !== document.languageId && rpc.filename === document.fileName) {
    await rpc.fileChanged(document)
  }
}
