import { debug, Disposable, window, workspace } from 'vscode'
import { rpc } from '../consts'
import debugStarted from './vscode/debugStarted'
import debugStopped from './vscode/debugStopped'
import openedTextDocument from './vscode/openedTextDocument'
import textEditorChanged from './vscode/textEditorChanged'

const vscodeEvents: {
  textEditorChanged?: Disposable
  openedTextDocument?: Disposable
  // closedTextDocument?: Disposable
  debugStarted?: Disposable
  debugStopped?: Disposable
} = {}

const rpcEvents: {
  ready: () => void
} = {
  ready: () => {
    console.log('Ready!')
  }
}

export const connectEventListeners = (): boolean => {
  vscodeEvents.textEditorChanged = window.onDidChangeActiveTextEditor(
    textEditorChanged
  )
  vscodeEvents.openedTextDocument = workspace.onDidOpenTextDocument(
    openedTextDocument
  )
  // vscodeEvents.closedTextDocument = workspace.onDidCloseTextDocument(
  //   closedTextDocument
  // )
  vscodeEvents.debugStarted = debug.onDidStartDebugSession(debugStarted)
  vscodeEvents.debugStopped = debug.onDidTerminateDebugSession(debugStopped)

  rpc.client.on('ready', rpcEvents.ready)
  return true
}

export const destroyEventListeners = (): boolean => {
  vscodeEvents.textEditorChanged?.dispose()
  vscodeEvents.openedTextDocument?.dispose()
  // vscodeEvents.closedTextDocument?.dispose()
  vscodeEvents.debugStarted?.dispose()
  vscodeEvents.debugStopped?.dispose()

  rpc.client.off('ready', rpcEvents.ready)
  return true
}
