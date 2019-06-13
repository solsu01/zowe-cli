/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { DefaultHelpGenerator, Imperative, ImperativeConfig, IO } from "@zowe/imperative";
import { Constants } from "../../packages";
import * as fs from "fs";
import * as path from "path";

const marked = require("marked");

interface ITreeNode {
    id: string;
    text: string;
    children: undefined | ITreeNode[];
}

function genDocsHeader(title: string): string {
    return `<!DOCTYPE html>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>${title}</title>
<link rel="stylesheet" href="../../node_modules/github-markdown-css/github-markdown.css">
<link rel="stylesheet" href="../css/docs.css">
<article class="markdown-body">
`;
}

function genBreadcrumb(baseName: string, fullCommandName: string): string {
    const crumbs: string[] = [];
    let hrefPrefix: string = "";
    [baseName, ...fullCommandName.split("_")].forEach((linkText: string) => {
        crumbs.push(`<a href="${hrefPrefix}${linkText}.html">${linkText}</a>`);
        hrefPrefix += `${linkText}_`;
    });
    return crumbs.join(" → ");
}

const docsFooter = `</article>
<link rel="stylesheet" href="../../node_modules/balloon-css/balloon.min.css">
<script src="../../node_modules/clipboard/dist/clipboard.js"></script>
<script src="../docs.js"></script>
`;

function processChildrenSummaryTables(helpGen: DefaultHelpGenerator): string {
    return helpGen.buildChildrenSummaryTables().split(/\r?\n/g)
        .slice(1)  // Delete header line
        .map((line: string) => {
            // Wrap group/command names inside links
            const match = line.match(/^\s*([a-z-]+(?:\s\|\s[a-z-]+)*)\s+[a-z]/i);
            if (match) {
                const href = `${match[1].split(" ")[0]}.html`;
                return `\n* <a href="${href}">${match[1]}</a> -` + line.slice(match[0].length - 2).replace(/\.\s*$/, "");
            }
            return " " + line.trim().replace(/\.\s*$/, "");
        }).join("");
}

(async () => {
    const baseName: string = Constants.BINARY_NAME;
    const treeNodes: ITreeNode[] = [];
    const aliasList: { [key: string]: string[] } = {};

    const docDir = path.join(__dirname, "..", "src", "cmd_docs");
    const treeDataFile = path.join(__dirname, "..", "src", "tree-data.js");
    const rootHelpHtmlPath = path.join(docDir, `${baseName}.html`);

    IO.createDirsSync(docDir);
    // Get all command definitions
    const myConfig = ImperativeConfig.instance;
    // myConfig.callerLocation = __dirname;
    myConfig.loadedConfig = require("../../packages/imperative");
    // Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];
    // Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    process.mainModule.filename = __dirname + "/../../package.json";
    await Imperative.init(myConfig.loadedConfig);

    const uniqueDefinitions = Imperative.fullCommandTree;
    uniqueDefinitions.children = uniqueDefinitions.children
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((item, pos, self) => self.indexOf(item) === pos);  // remove duplicate items

    treeNodes.push({ id: `${baseName}.html`, text: baseName, children: [] });
    let rootHelpContent = genDocsHeader(baseName);
    rootHelpContent += `<h2><a href="${baseName}.html">${baseName}</a></h2>\n`;
    rootHelpContent += marked(Constants.DESCRIPTION) + "\n";
    let helpGen = new DefaultHelpGenerator({
        produceMarkdown: true,
        rootCommandName: baseName
    } as any, {
        commandDefinition: uniqueDefinitions,
        fullCommandTree: uniqueDefinitions
    });
    rootHelpContent += marked(`<h4>Groups</h4>\n` + processChildrenSummaryTables(helpGen));
    rootHelpContent += docsFooter;
    fs.writeFileSync(rootHelpHtmlPath, rootHelpContent);

    function generateCommandHelpPage(definition: any, fullCommandName: string, tree: any) {
        let markdownContent = `<h2>` + genBreadcrumb(baseName, fullCommandName) + `</h2>\n`;
        helpGen = new DefaultHelpGenerator({
            produceMarkdown: true,
            rootCommandName: baseName
        } as any, {
            commandDefinition: definition,
            fullCommandTree: Imperative.fullCommandTree
        });
        markdownContent += helpGen.buildHelp() + "\n";
        // escape <group> and <command> fields
        markdownContent = markdownContent.replace(/<group>/g, "`<group>`");
        markdownContent = markdownContent.replace(/<command>/g, "`<command>`");
        markdownContent = markdownContent.replace(/\\([.-])/g, "$1");
        markdownContent = markdownContent.replace(/[‘’]/g, "'");
        if (definition.type === "group") {
            // this is disabled for the CLIReadme.md but we want to show children here
            // so we'll call the help generator's children summary function even though
            // it's usually skipped when producing markdown
            markdownContent += `<h4>Commands</h4>\n` + processChildrenSummaryTables(helpGen);
        }

        const docFilename = (fullCommandName + ".html").trim();
        const docPath = path.join(docDir, docFilename);
        const treeNode: any = {
            id: docFilename,
            text: [definition.name, ...definition.aliases].join(" | "),
            children: []
        };
        tree.children.push(treeNode);

        definition.aliases.forEach((alias: string) => {
            if (alias !== definition.name) {
                if (aliasList[alias] === undefined) {
                    aliasList[alias] = [definition.name];
                } else if (aliasList[alias].indexOf(definition.name) === -1) {
                    aliasList[alias].push(definition.name);
                }
            }
        });

        markdownContent = marked(markdownContent);
        markdownContent = markdownContent.replace(/<code>\$(.*?)<\/code>/g,
            "<code>$1</code> <button class=\"btn-copy\" data-balloon-pos=\"right\" data-clipboard-text=\"$1\">Copy</button>");
        const helpContent = genDocsHeader(fullCommandName) + markdownContent + docsFooter;
        fs.writeFileSync(docPath, helpContent);

        console.log("doc generated to " + docPath);

        if (definition.children) {
            definition.children.forEach((child: any) => {
                generateCommandHelpPage(child, `${fullCommandName}_${child.name}`, treeNode);
            });
        }
    }

    uniqueDefinitions.children.forEach((def) => {
        generateCommandHelpPage(def, def.name, treeNodes[0]);
    });

    console.log("Generated documentation pages for all commands and groups");
    fs.writeFileSync(treeDataFile, "const treeNodes = " + JSON.stringify(treeNodes, null, 2) + ";\nconst aliasList = " +
    JSON.stringify(aliasList, null, 2) + ";\n");
})();
