import { workspace } from 'vscode'
import { RPC } from './utils/rpc'

export const CLIENT_ID = '392660580806164491'

export const rpc = new RPC(
  workspace
    .getConfiguration('d1sc0rd-64m3-rpc')
    .get<string | null>('clientID') ?? CLIENT_ID
)
