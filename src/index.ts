import { load } from "cheerio"
import { prompt } from "enquirer"
import { readFile, readdir } from "fs/promises"

import extract from "./lib/extract"
import transform from "./lib/transform"
import apply from "./lib/apply"

readdir(`${__dirname}/../banners`).then(async (templates) => {
    let selected_template = await prompt({
        type: "select",
        name: "template",
        message: "Select a template",
        choices: templates
    }) as {template: string}

    let page = (await readFile(`${__dirname}/../banners/${selected_template.template}`)).toString()
    let $ = load(page);

    let base = extract($);

    let x = await prompt({
        type: "form",
        name: "fillin",
        message: "Please update the following variables.",
        choices: base.variables.map(v => {
            return {
                name: v.name,
                message: `${v.name}${v.required ? "*" : ""}`
            }
        }) // todo: type gymnastics (keyof typeof base.variables[number].name?)
    }) as { fillin: { [key: string]: string } }

})