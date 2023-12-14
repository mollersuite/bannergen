/**
 * These functions handle application of variables to the DOM
 */

import type { CheerioAPI } from "cheerio";

export let transformations: { [x in Transformation]: ($: CheerioAPI, target: string, value: string) => void } = {
    slot: ($, target, value) => { // replace the innerHTML of slots in the DOM
        $(`slot[${target}]`).html(value)
    },
    "slot-text": ($, target, value) => { // replace the text of slots in the DOM
        $(`slot[${target}]`).text(value)
    },
    css: ($, target, value) => {
        // probably not the greatest way to do it
        // but it's fine
        $("body").append(`<style>:root { ${target}: ${value} }</style>`)
    }
} as const

export type Transformation = "slot" | "slot-text" | "css"
export type ApplicationTarget = `${Transformation} ${string}`

export default function apply($: CheerioAPI, inputs: { [key: ApplicationTarget]: string }) {
    Object.entries(inputs).forEach(([to, value]) => {
        let match = to.match(/(\S+) (.*)/)
        let transformation = match?.[1] as Transformation
        let target = match?.[2] as string

        if (transformation in transformations) {
            transformations[transformation]($, target, value)
        }
    })

    return $
}