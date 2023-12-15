import { type CheerioAPI, load } from "cheerio"
import { readFile } from "fs/promises"
import renderHtml from "node-html-to-image"

import extract from "./helpers/extract"
import transform from "./helpers/transform"
import apply from "./helpers/apply"

export default async function render(
    template: string,
    inputs: { [key: string]: string },
    output?: string,
    $?: CheerioAPI
) {
    // if not already loaded, let's load in the template
    if (!$)
        $ = load(
            (await readFile(`${__dirname}/../../banners/${template}.html`))
                .toString()
        )

    let base = extract($);

    let applications = (await Promise.all(base.variables.map(async v => {
        if (!inputs[v.name]) {
            if (v.required) throw `did not provide required value ${v.name}`
            else return
        }

        let value: string
        if (v.transformation) value = await transform(v.transformation, inputs[v.name])!
        else value = inputs[v.name]

        return [ v.target, value ]
    }))).filter((e): e is string[] => Boolean(e))

    apply($, Object.fromEntries(applications))

    return await renderHtml({
        output,
        html: $.html()
    })
}