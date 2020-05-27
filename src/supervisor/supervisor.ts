/**
 * Copyright (c) 2020 BlockDev AG
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as net from "net"
import { platform } from "os"
import { Socket } from "net"
import { spawn } from "child_process"

import * as sudo from "sudo-prompt"

import * as packageJson from "../../package.json"
import { staticAssetPath } from "../utils/paths"
import { analytics } from "../analytics/analytics-main"
import { AppAction, Category } from "../analytics/analytics"

const isWin = platform() === "win32"

function mystSockPath(): string {
    if (isWin) {
        return "\\\\.\\pipe\\mystpipe"
    }
    return "/var/run/myst.sock"
}

export class Supervisor {
    conn?: Socket

    async connect(): Promise<void> {
        console.log("Connecting to the supervisor...")
        const mystSock = mystSockPath()
        return await new Promise((resolve, reject) => {
            this.conn = net
                .createConnection(mystSock)
                .on("connect", () => {
                    console.info("Connected to: ", mystSock)
                    analytics.event(Category.App, AppAction.ConnectedToSupervisor)
                    return resolve()
                })
                .on("data", (data: Buffer) => {
                    console.info("Server:", data.toString())
                })
                .on("error", function (data) {
                    return reject(data)
                })
        })
    }

    async install(): Promise<void> {
        let supervisorBinaryName = "myst_supervisor"
        if (isWin) {
            supervisorBinaryName += ".exe"
        }
        const supervisorPath = staticAssetPath(supervisorBinaryName)
        analytics.event(Category.App, AppAction.InstallSupervisor)
        return await new Promise((resolve, reject) => {
            try {
                sudo.exec(
                    `${supervisorPath} -install`,
                    {
                        name: packageJson.productName,
                        icns: staticAssetPath("logo.icns"),
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (error, stdout, stderr) => {
                        console.log("[sudo-exec]", stdout, stderr)
                        if (error) {
                            return reject(error)
                        }
                    },
                )
            } catch (err) {
                reject(err)
            }
            const waitUntilConnected = (): void => {
                this.connect()
                    .then(() => resolve())
                    .catch(() => setTimeout(waitUntilConnected, 500))
            }
            setTimeout(waitUntilConnected, 500)
        })
    }

    disconnect(): void {
        if (this.conn) {
            this.conn.destroy()
        }
    }

    killMyst(): void {
        if (!this.conn) {
            throw new Error("Supervisor is not connected")
        }
        this.conn.write("kill\n")
    }

    // Myst process is not started from supervisor as supervisor runs as root user
    // which complicates starting myst process as non root user.
    startMyst(): Promise<void> {
        let mystBinaryName = "myst"
        if (isWin) {
            mystBinaryName += ".exe"
        }
        const mystPath = staticAssetPath(mystBinaryName)
        const mystProcess = spawn(
            mystPath,
            ["--mymysterium.enabled=false", "--ui.enable=false", "--usermode", "daemon"],
            {
                detached: true, // Needed for unref to work correctly.
                stdio: "ignore", // Needed for unref to work correctly.
            },
        )

        // Unreference myst node process from main electron process which allow myst to run
        // independenly event after app is force closed. This allows supervisor to finish
        // node shutdown gracefully.
        mystProcess.unref()

        mystProcess.on("close", (code) => {
            console.log(`myst process exited with code ${code}`)
        })

        return Promise.resolve()
    }
}

export const supervisor = new Supervisor()
