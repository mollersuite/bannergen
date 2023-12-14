import { load } from "cheerio"
import { prompt } from "enquirer"
import { readFile, readdir } from "fs/promises"
import render from "node-html-to-image"
import { basename, resolve } from "path"

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

    let inputs = (await prompt({
        type: "form",
        name: "fillin",
        message: "Please set the following variables.",
        choices: base.variables.map(v => {
            return {
                name: v.name,
                message: `${v.name}${v.required ? "*" : ""}`
            }
        })
    }) as { fillin: { [key: string]: string } }).fillin

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

    let output = (await prompt({
        type: "input",
        name: "output",
        message: "Please set the following variables.",
        initial: resolve(`${__dirname}/../renders/${basename(selected_template.template, ".html")}`)
    }) as { fillin: { [key: string]: string } }).fillin

})