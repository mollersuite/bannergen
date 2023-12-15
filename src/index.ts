import { load } from "cheerio"
import { prompt } from "enquirer"
import { readFile, readdir } from "fs/promises"
import { basename, resolve } from "path"

import extract from "./lib/helpers/extract"
import render from "./lib/render"

readdir(`${__dirname}/../presets`).then(async (projectList) => {

   let preset = (await prompt({
        type: "select",
        name: "preset",
        message: "Select a project to render the assets for...",
        choices: [
            ...projectList,
            "Do not use a preset"
        ],
    }) as { preset: string }).preset

    if (preset == "Do not use a preset") {

        // get a list of templates and prompt the user
        let templates = await readdir(`${__dirname}/../banners`)

        let template = (await prompt({
            type: "select",
            name: "template",
            message: "Select a template",
            choices: templates.map(e => basename(e, ".html"))
        }) as {template: string}).template
    
        // extract 
        let page = (await readFile(`${__dirname}/../banners/${template}.html`)).toString()
        let $ = load(page);
        let base = extract($);

        let { inputs, output } = (await prompt([
            {
                type: "form",
                name: "inputs",
                message: "Please set the following variables.",
                choices: base.variables.map(v => {
                    return {
                        name: v.name,
                        message: `${v.name}${v.required ? "*" : ""}`,
                        initial: v.target.startsWith("mode ") ? "y/n" : undefined
                    }
                })
            },
            {
                type: "input",
                name: "output",
                message: "Where would you like to save the render?",
                initial: resolve(`${__dirname}/../renders/${template}.png`)
            }
        ]) as { inputs: { [key: string]: string }, output: string })

        await render(template, inputs, output, $)
        console.log(`Render saved to ${output}`)
    } else {

        // alright, let's start rendering everything in that preset

        let templatePresets: {template: string, inputs: {[key: string]: string}}[] = [];
        
        (await Promise.all(
            (await readdir(`${__dirname}/../presets/${preset}/variables`))
            .map(async (filename) => {
                // read the JSON
                let templateValues = JSON.parse(
                    (await readFile(`${__dirname}/../presets/${preset}/variables/${filename}`)).toString()
                ) as { [key: string]: string } | { [key: string]: string }[]

                // if it's not already an array, make it one
                if (!Array.isArray(templateValues)) 
                    templateValues = [ templateValues ] as { [key: string]: string }[]

                // turn each item in the array into a template preset
                return templateValues.map(v => {
                    return {
                        template: basename(filename, ".json"),
                        inputs: Object.fromEntries(
                            Object.entries(v).map(([key, value]) => { 
                                return [ key, 
                                    value.startsWith("[ASSET] ")
                                    // Resolve "[ASSET] abc.xyz" to "./presets/preset/assets/abc.xyz" 
                                    ? `${__dirname}/../presets/${preset}/assets/${value.match(/\[ASSET\] (.*)/)?.[1]}`
                                    : value 
                                ] 
                            })
                        )
                    }
                })

            })
            // unwrap all of the arrays filled with template presets
            // into one large one
        )).forEach((v: typeof templatePresets) => {
            v.forEach(e => templatePresets.push(e))
        })

        templatePresets.forEach(async ({template, inputs}, x) => {
            let outDir = resolve(`${__dirname}/../renders/${inputs["$ID"] || preset}-${template}.png`)
            await render(template, inputs, outDir)
            console.log(`Rendered to ${outDir}`)
        })

    }

})