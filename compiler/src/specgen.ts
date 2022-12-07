import {
    cStorage,
    addComment,
    wrapComment,
    jsQuote,
} from "../../runtime/jacdac-c/jacdac/spectool/jdspec"
import { jacdacDefaultSpecifications } from "./embedspecs"
import { prelude } from "./prelude"
import { camelize, upperCamel } from "./util"

function isRegister(k: jdspec.PacketKind) {
    return k == "ro" || k == "rw" || k == "const"
}

function toHex(n: number): string {
    if (n === undefined) return ""
    if (n < 0) return "-" + toHex(n)
    return "0x" + n.toString(16)
}

export function specToDeviceScript(info: jdspec.ServiceSpec) {
    let r = `// Service: ${info.name}\n`

    for (const en of Object.values(info.enums)) {
        const enPref = enumName(en.name)
        r += `declare enum ${enPref} { // ${cStorage(en.storage)}\n`
        for (const k of Object.keys(en.members)) {
            r += "    " + k + " = " + toHex(en.members[k]) + ",\n"
        }
        r += "}\n\n"
    }

    const clname = upperCamel(info.camelName) + "Role"
    const baseclass =
        info.extends.indexOf("_sensor") >= 0 ? "SensorRole" : "Role"
    r += `declare class ${clname} extends ${baseclass} {\n`

    for (const pkt of info.packets) {
        if (pkt.derived) continue // ???
        const cmt = addComment(pkt)

        let tp = ""

        // if there's a startRepeats before last field, we don't put ... before it
        const earlyRepeats = pkt.fields
            .slice(0, pkt.fields.length - 1)
            .some(f => f.startRepeats)

        const fields = pkt.fields
            .map(f => {
                const tp =
                    f.type == "string" || f.type == "string0"
                        ? "string"
                        : info.enums[f.type]
                        ? enumName(f.type)
                        : "number"
                if (f.startRepeats && !earlyRepeats)
                    return `...${f.name}: ${tp}[]`
                else return `${f.name}: ${tp}`
            })
            .join(", ")

        if (isRegister(pkt.kind)) {
            if (cmt.needsStruct) {
                tp = `JDRegisterArray`
                if (pkt.fields.length > 1) tp += ` & { ${fields} }`
            } else {
                if (pkt.fields.length == 1 && pkt.fields[0].type == "string")
                    tp = "JDRegisterString"
                else tp = "JDRegisterNum"
            }
        } else if (pkt.kind == "event") {
            tp = "JDEvent"
        } else if (pkt.kind == "command") {
            r += wrapComment("devs", cmt.comment)
            r += `    ${camelize(pkt.name)}(${fields}): void\n`
        }

        if (tp) {
            r += wrapComment("devs", cmt.comment)
            r += `    ${camelize(pkt.name)}: ${tp}\n`
        }
    }

    r += "}\n"

    if (info.shortId[0] != "_") {
        r += `declare namespace roles {
    /**
     * Declares a new ${info.name} service role.
    **/
    function ${jsQuote(info.camelName)}(): ${clname}
}\n\n`
    } else {
        r += "\n"
    }

    return r.replace(/ *$/gm, "")

    function enumName(n: string) {
        return upperCamel(info.camelName) + upperCamel(n)
    }
}

export function preludeFiles(specs?: jdspec.ServiceSpec[]) {
    if (!specs) specs = jacdacDefaultSpecifications
    const r = { ...prelude }
    r["devicescript-spec.d.ts"] = specs.map(specToDeviceScript).join("\n")
    return r
}