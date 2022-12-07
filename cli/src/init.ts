import { CmdOptions, debug, GENDIR, LIBDIR, log } from "./command"
import { dirname, join } from "node:path"
import {
    pathExistsSync,
    writeFileSync,
    writeJSONSync,
    emptyDirSync,
    readFileSync,
    ensureDirSync,
} from "fs-extra"
import { preludeFiles } from "@devicescript/compiler"

const MAIN = "main.ts"
const GITIGNORE = ".gitignore"

const optionalFiles: Record<string, any> = {
    "tsconfig.json": {
        compilerOptions: {
            moduleResolution: "node",
            target: "es2022",
            module: "es2015",
            lib: [],
            strict: true,
            strictNullChecks: false,
            strictFunctionTypes: true,
            sourceMap: false,
            declaration: false,
            experimentalDecorators: true,
            preserveConstEnums: true,
            noImplicitThis: true,
            isolatedModules: true,
            noImplicitAny: true,
            moduleDetection: "force",
            types: [],
        },
        include: ["*.ts", `${LIBDIR}/*.ts`],
    },
    ".prettierrc": {
        arrowParens: "avoid",
        semi: false,
        tabWidth: 4,
    },
    ".vscode/extensions.json": {
        recommendations: ["esbenp.prettier-vscode", "dbaeumer.vscode-eslint"],
    },
}
export interface InitOptions {
    force?: boolean
    spaces?: number
}

export default function init(options: InitOptions & CmdOptions) {
    const { force, spaces = 4 } = options
    log(`Initializing files for DeviceScript project`)
    Object.keys(optionalFiles).forEach(fn => {
        // tsconfig.json
        if (!pathExistsSync(fn) || force) {
            const data = optionalFiles[fn]
            debug(`write ${fn}`)
            const dn = dirname(fn)
            if (dn) ensureDirSync(dn)
            writeJSONSync(fn, data, { spaces })
        } else {
            debug(`skip ${fn}, already exists`)
        }
    })

    // typescript definitions
    emptyDirSync(LIBDIR)
    debug(`write ${LIBDIR}/*`)
    const prelude = preludeFiles()
    for (const fn of Object.keys(prelude)) {
        writeFileSync(join(LIBDIR, fn), prelude[fn])
    }

    // .gitignore
    const gid = `${GENDIR}/\n`
    if (!pathExistsSync(GITIGNORE)) {
        debug(`write ${GITIGNORE}`)
        writeFileSync(GITIGNORE, gid, { encoding: "utf8" })
    } else {
        const gitignore = readFileSync(GITIGNORE, { encoding: "utf8" })
        if (gitignore.indexOf(gid) < 0) {
            debug(`update ${GITIGNORE}`)
            writeFileSync(GITIGNORE, `${gitignore}\n${gid}`, {
                encoding: "utf8",
            })
        }
    }

    // main.ts
    if (!pathExistsSync(MAIN)) {
        debug(`write ${MAIN}`)
        writeFileSync(MAIN, `// put your code here!\n`, { encoding: "utf8" })
    }

    // help message
    log(`Your DeviceScript project is ready.`)
    log(`to start the local development, run "yarn start"`)
    log(`to build binaries, run "yarn build"`)
}
