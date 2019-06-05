import { DefaultHelpGenerator, Imperative, ImperativeConfig, IO } from "@zowe/imperative";
import { Constants } from "../../packages";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";

const marked = require("marked");

const iframeHackScript = `<script type="text/javascript">
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("t") === "1") {
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        if (links[i].host !== window.location.host) {
            links[i].setAttribute("target", "_parent");
        } else {
            links[i].setAttribute("onclick", "window.parent.postMessage(this.href, '*'); return false;");
        }
    }
}
</script>`;

(async () => {
    process.env.FORCE_COLOR = "0";
    const docDir = path.join(__dirname, "..", "src", "cmd_docs");
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
    const loadedDefinitions = Imperative.fullCommandTree;

    let totalCommands = 0;
    const rootHelpHtmlPath = path.join(docDir, "cli_root_help.html");

    const rootTreeNode: any = [{
        id: "cli_root_help.html",
        text: Constants.BINARY_NAME,
        children: []
    }];
    const treeFile = path.join(__dirname, "..", "src", "tree-nodes.js");

    let rootHelpContent = marked(Constants.DESCRIPTION);
    rootHelpContent = "<link rel=\"stylesheet\" href=\"../css/github.css\" /><article class=\"markdown-body\">\n<h2>" +
        "<a href=\"cli_root_help.html\">" + Constants.BINARY_NAME + "</a></h2>\n" + rootHelpContent;
    let helpGen = new DefaultHelpGenerator({
        produceMarkdown: true,
        rootCommandName: Constants.BINARY_NAME
    } as any, {
        commandDefinition: loadedDefinitions,
        fullCommandTree: loadedDefinitions
    });
    rootHelpContent += marked(`\n<h4>Groups</h4>\n` +
        `${helpGen.buildChildrenSummaryTables().split(/\r?\n/g)
            .slice(1) // delete the first line which says ###GROUPS
            .filter((item, pos, self) => self.indexOf(item) === pos)  // remove duplicate lines
            .map((groupLine: string) => {
                const match = groupLine.match(/^\s*([a-z-]+(?:\s\|\s[a-z-]+)?)/i);
                if (match) {
                    const href = `${match[1].split(" ")[0]}.html`;
                    return `* <a href="${href}">${match[1]}</a> -` + groupLine.slice(match[0].length).replace(/\.\s*$/, "");
                }
                return groupLine;
            })
            .join("\n")}`);
    rootHelpContent += "</article>" + iframeHackScript;
    fs.writeFileSync(rootHelpHtmlPath, rootHelpContent);

    function generateBreadcrumb(fullCommandName: string): string {
        const crumbs: string[] = [];
        crumbs.push(`<a href="cli_root_help.html">${Constants.BINARY_NAME}</a>`);
        let hrefPrefix: string = "";
        fullCommandName.split("_").forEach((linkText: string) => {
            crumbs.push(`<a href="${hrefPrefix}${linkText}.html">${linkText}</a>`);
            hrefPrefix += `${linkText}_`;
        });
        return crumbs.join(" -> ");
    }

    function generateCommandHelpPage(definition: any, fullCommandName: string, tree: any) {
        totalCommands++;
        let markdownContent = `<h2>` + generateBreadcrumb(fullCommandName) + `</h2>\n`;
        helpGen = new DefaultHelpGenerator({
            produceMarkdown: true,
            rootCommandName: Constants.BINARY_NAME
        } as any, {
            commandDefinition: definition,
            fullCommandTree: loadedDefinitions
        });
        markdownContent += helpGen.buildHelp();
        // escape <group> and <command> fields
        markdownContent = markdownContent.replace(/<group>/g, "`<group>`");
        markdownContent = markdownContent.replace(/<command>/g, "`<command>`");
        markdownContent = markdownContent.replace(/\\([.-])/g, "$1");
        markdownContent = markdownContent.replace(/[‘’]/g, "'");
        if (definition.type === "group") {
            // this is disabled for the CLIReadme.md but we want to show children here
            // so we'll call the help generator's children summary function even though
            // it's usually skipped when producing markdown
            markdownContent += `\n<h4>Commands</h4>\n` +
                `${helpGen.buildChildrenSummaryTables().split(/\r?\n/g)
                    .slice(1) // delete the first line which says ###COMMANDS
                    .map((commandLine: string) => {
                        const match = commandLine.match(/^\s*([a-z-]+(?:\s\|\s[a-z-]+)?)\s*[A-Z]/);
                        if (match) {
                            const href = `${fullCommandName}_${match[1].split(" ")[0]}.html`;
                            return `* <a href="${href}">${match[1]}</a> -` + commandLine.slice(match[0].length - 2).replace(/\.\s*$/, "");
                        }
                        return commandLine;
                    })
                    .join("\n")}`;
        }

        const docFilename = (fullCommandName + ".html").trim();
        const docPath = path.join(docDir, docFilename);
        const treeNode: any = {
            id: docFilename,
            text: definition.name,
            children: []
        };
        tree.children.push(treeNode);

        markdownContent = marked(markdownContent);
        markdownContent = markdownContent.replace(/<code>\$(.*?)<\/code>/g,
            "<code>$1</code> <button class=\"btn\" data-clipboard-text='$1'>Copy</button>");
        const helpContent =
            "<link rel=\"stylesheet\" href=\"../css/github.css\" /> <article class=\"markdown-body\">\n"
            + markdownContent + "</article>" + "<script src=\"../../node_modules/clipboard/dist/clipboard.js\"></script> " +
            "<script type=\"text/javascript\">new ClipboardJS('.btn');</script>" + iframeHackScript;
        fs.writeFileSync(docPath, helpContent);

        console.log(chalk.grey("doc generated to " + docPath));

        if (definition.children) {
            for (const child of definition.children) {

                generateCommandHelpPage(child, fullCommandName + "_" + child.name, treeNode);
            }
        }
    }

// --------------------------------------------------------
// Remove duplicates from Imperative.fullCommandTree
    const allDefSoFar: string[] = [];
    const definitionsArray = loadedDefinitions.children.sort((a, b) => a.name.localeCompare(b.name))
        .filter((cmdDef) => {
            if (allDefSoFar.indexOf(cmdDef.name) === -1) {
                allDefSoFar.push(cmdDef.name);
                return true;
            }
            return false;
        });
// --------------------------------------------------------

    for (const def of definitionsArray) {
        generateCommandHelpPage(def, def.name, rootTreeNode[0]);
    }


    console.log(chalk.blue("Generated documentation pages for " + totalCommands + " commands and groups"));
    fs.writeFileSync(treeFile, "const treeNodes = " + JSON.stringify(rootTreeNode, null, 2) + ";");
    process.env.FORCE_COLOR = undefined;
})();
