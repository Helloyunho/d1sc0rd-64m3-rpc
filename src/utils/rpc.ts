import { ActivityType, Presence, RPClient } from 'rpcord'
import {
  debug,
  TextDocument,
  window,
  workspace,
  WorkspaceConfiguration
} from 'vscode'
import { Status } from '../types/status'
import * as path from 'path'
import { stat as fsStat, Stats } from 'fs'
import filesize from 'filesize'

export class RPC {
  presence: Presence
  client: RPClient
  file?: TextDocument
  filename?: string
  lang?: string
  status: Status = Status.IDLE
  debugging: boolean = false

  constructor(clientID: string) {
    this.presence = new Presence({
      type: ActivityType.Game,
      assets: {
        small_image: 'vscode'
      }
    })
    this.client = new RPClient(clientID)
  }

  get config(): WorkspaceConfiguration {
    return workspace.getConfiguration('d1sc0rd-64m3-rpc')
  }

  async formatText(text?: string): Promise<string | undefined> {
    if (text === undefined) {
      return undefined
    }
    const TEXT_REGEX = /{(([a-z]|:)*)}/gm
    const getRightValue = async (part: string): Promise<string> => {
      const variable = part.split(':')[0]
      const altVariables = part.split(':').slice(1).join(':')
      switch (variable) {
        case 'lang': {
          const lang = this.file?.languageId
          if (lang === undefined) {
            break
          } else {
            return lang
          }
        }
        case 'filename': {
          const filename = this.file?.fileName
          if (filename === undefined) {
            break
          } else {
            return path.basename(filename)
          }
        }
        case 'dirname': {
          const filename = this.file?.fileName
          if (filename === undefined) {
            break
          } else {
            const pathSplited = filename.split(path.sep)
            return pathSplited[pathSplited.length - 2]
          }
        }
        case 'fulldirpath': {
          const filename = this.file?.fileName
          if (filename === undefined) {
            break
          } else {
            return path.dirname(filename)
          }
        }
        case 'workspace': {
          const workspaceName = workspace.name
          if (workspaceName === undefined) {
            break
          } else {
            return workspaceName
          }
        }
        case 'filesize': {
          const filename = this.file?.fileName
          if (filename === undefined) {
            break
          } else {
            const stat: Stats | undefined = await new Promise(
              (resolve, reject) =>
                fsStat(filename, (error, stat) => {
                  if (error !== null) {
                    if (error.code === 'ENOENT') {
                      resolve(undefined)
                    }
                    reject(error)
                  } else {
                    resolve(stat)
                  }
                })
            )
            if (stat === undefined) {
              break
            }
            return filesize(stat.size)
          }
        }
        case 'totallines': {
          const fileLines = this.file?.lineCount
          if (fileLines === undefined) {
            break
          } else {
            return fileLines.toString()
          }
        }
      }
      return altVariables.length !== 0 ? await getRightValue(altVariables) : ''
    }

    let result = text
    let group = TEXT_REGEX.exec(text)
    while (group !== null) {
      result = result.replace(group[0], await getRightValue(group[1]))

      group = TEXT_REGEX.exec(text)
    }

    return result
  }

  async connect(): Promise<void> {
    this.presence.setStartTimestamp(Date.now())
    await this.client.connect()
    this.file = window.activeTextEditor?.document
    await this.statusChanged(
      debug.activeDebugSession !== undefined
        ? Status.DEBUGGING
        : this.file !== undefined
          ? Status.EDITING
          : Status.IDLE
    )
    await this.client.setActivity(this.presence)
  }

  disconnect(): void {
    this.client.disconnect()
  }

  async update(): Promise<void> {
    await this.client.setActivity(this.presence)
  }

  async langChanged(lang: string): Promise<void> {
    this.lang = lang
    let smallText: string | undefined
    let largeText: string | undefined
    switch (this.status) {
      case Status.IDLE: {
        smallText = this.config.get<string>('smallText.idling')
        largeText = this.config.get<string>('largeText.idling')
        break
      }
      case Status.EDITING: {
        smallText = this.config.get<string>('smallText.editing')
        largeText = this.config.get<string>('largeText.editing')
        break
      }
      case Status.DEBUGGING: {
        smallText = this.config.get<string>('smallText.debugging')
        largeText = this.config.get<string>('largeText.debugging')
        break
      }
      default: {
        console.warn('WARNING!! Unknown status came out.')
      }
    }
    this.presence
      .setLargeImage(lang)
      .setLargeText(await this.formatText(largeText))
    this.presence.setSmallText(await this.formatText(smallText))
    await this.update()
  }

  async fileChanged(file: TextDocument | undefined): Promise<void> {
    this.file = file
    this.filename = file?.fileName
    if (file === undefined) {
      this.presence.setDetails(
        await this.formatText(this.config.get<string>('details.idling'))
      )
      if (this.status === Status.EDITING) {
        await this.statusChanged(Status.IDLE, false)
      }
      await this.langChanged('idle')
    } else {
      if (this.status === Status.IDLE) {
        await this.statusChanged(
          this.debugging ? Status.DEBUGGING : Status.EDITING,
          false
        )
      }
      switch (this.status) {
        case Status.EDITING: {
          this.presence.setDetails(
            await this.formatText(this.config.get<string>('details.editing'))
          )
          break
        }
        case Status.DEBUGGING: {
          this.presence.setDetails(
            await this.formatText(this.config.get<string>('details.debugging'))
          )
          break
        }
        default: {
          console.warn('WARNING!! Unknown status came out.')
        }
      }
      await this.langChanged(file.languageId)
    }
  }

  async statusChanged(status: Status, callFileChanged = true): Promise<void> {
    this.status = status
    switch (status) {
      case Status.IDLE: {
        this.presence.setState(
          await this.formatText(this.config.get<string>('state.idling'))
        )
        break
      }
      case Status.EDITING: {
        this.presence.setState(
          await this.formatText(this.config.get<string>('state.editing'))
        )
        break
      }
      case Status.DEBUGGING: {
        this.presence.setState(
          await this.formatText(this.config.get<string>('state.debugging'))
        )
        break
      }
      default: {
        console.warn('WARNING! Unknown status came out.')
      }
    }
    if (callFileChanged) {
      await this.fileChanged(this.file)
    }
  }

  async debugStateChanged(state: boolean): Promise<void> {
    this.debugging = state
    await this.statusChanged(
      state
        ? Status.DEBUGGING
        : this.file !== undefined
          ? Status.EDITING
          : Status.IDLE
    )
  }
}
