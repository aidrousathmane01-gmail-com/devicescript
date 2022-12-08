import { jacsFactory } from "./build"
import { CmdOptions, error } from "./command"
import { readCompiled } from "./run"

export interface RunOptions {
    tcp?: boolean
}

export async function deployScript(
    fn: string,
    options: RunOptions & CmdOptions
) {
    const inst = await jacsFactory()
    if (options.tcp)
        await inst.setupNodeTcpSocketTransport(require, "127.0.0.1", 8082)
    else await inst.setupWebsocketTransport("ws://127.0.0.1:8081")
    inst.jacsStart()
    inst.deployHandler = code => {
        if (code) error(`deploy error ${code}`)
        process.exit(code)
    }

    const prog = await readCompiled(fn)
    const r = inst.jacsClientDeploy(prog)
    if (r) throw new Error("deploy error: " + r)
    console.log(`remote-deployed ${fn}`)
}