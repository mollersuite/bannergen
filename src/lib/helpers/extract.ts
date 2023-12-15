import type { CheerioAPI } from "cheerio";
import type { ApplicationTarget } from "./apply";
import type { DataTransformation } from "./transform";

export interface Definition {
    name: string
    transformation?: DataTransformation
    target: ApplicationTarget
    required: boolean
}

export interface AssetBase {
    description?: string
    variables: Definition[]
}

export default function extract($: CheerioAPI): AssetBase {
    return {
        description: $("meta[name=description]")?.attr("content"),
        variables: $("define").toArray().map(v => {
            return {
                name: v.attribs.var as string,
                transformation: v.attribs.as as DataTransformation | undefined,
                target: v.attribs.to as ApplicationTarget,
                required: v.attribs.required == ""
            }
        })
    }
}