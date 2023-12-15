/**
 * These functions transform values
 */

import { readFile } from "fs/promises"
import mime from "mime"

export type DataTransformation = "text-content" | "image-binary"

export let transformations: { [x in DataTransformation]: (value: string) => Promise<string> } = {
    "text-content": async (value) => (await readFile(value)).toString(),
    "image-binary": async (value) => `<img src="data:${mime.getType(value)};base64,${(await readFile(value)).toString("base64")}">`
}

export default function transform(transformation: DataTransformation, input: string) {
    if (transformation in transformations) {
        return transformations[transformation](input)
    }
}