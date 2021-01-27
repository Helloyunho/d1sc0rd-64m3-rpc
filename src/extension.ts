import * as vscode from 'vscode'
import { rpc } from './consts'
import { connectEventListeners, destroyEventListeners } from './events'

let connected = false

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const connect = vscode.commands.registerCommand(
    'd1sc0rd-64m3-rpc.connect',
    async () => {
      if (connected) {
        await vscode.window.showWarningMessage(
          'D1sc0rd 64m3 RPC: Already connected with Discord! You might want to try reconnecting instead.'
        )
        return
      }
      connectEventListeners()
      await rpc.connect()
      connected = true
      await vscode.window.showInformationMessage('D1sc0rd 64m3 RPC: Connected')
    }
  )
  const disconnect = vscode.commands.registerCommand(
    'd1sc0rd-64m3-rpc.disconnect',
    async () => {
      if (!connected) {
        await vscode.window.showWarningMessage(
          'D1sc0rd 64m3 RPC: Already disconnected with Discord! You might want to try connecting instead.'
        )
        return
      }
      destroyEventListeners()
      rpc.disconnect()
      connected = false
      await vscode.window.showInformationMessage(
        'D1sc0rd 64m3 RPC: Disconnected'
      )
    }
  )
  const reconnect = vscode.commands.registerCommand(
    'd1sc0rd-64m3-rpc.reconnect',
    async () => {
      if (connected) {
        destroyEventListeners()
        rpc.disconnect()
      }
      connectEventListeners()
      await rpc.connect()
      connected = true
      await vscode.window.showInformationMessage(
        'D1sc0rd 64m3 RPC: Reconnected'
      )
    }
  )

  connectEventListeners()
  await rpc.connect()
  connected = true

  context.subscriptions.push(connect, disconnect, reconnect)
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
