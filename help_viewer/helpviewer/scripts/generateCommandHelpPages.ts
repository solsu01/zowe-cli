import { DefaultHelpGenerator, Imperative, ImperativeConfig, IO } from "@zowe/imperative";
import { Constants } from "../../../packages";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";

const marked = require("marked");

(async () => {
    process.env.FORCE_COLOR = "0";
    const docDir = path.join(__dirname, "..", "src", "cmd_docs");
    IO.createDirsSync(docDir);
// Get all command definitions
    const myConfig = ImperativeConfig.instance;
// myConfig.callerLocation = __dirname;
    myConfig.loadedConfig = require("../../../packages/imperative");

// Need to avoid any .definition file inside of __tests__ folders
    myConfig.loadedConfig.commandModuleGlobs = ["**/!(__tests__)/cli/*.definition!(.d).*s"];

// Need to set this for the internal caller location so that the commandModuleGlobs finds the commands
    process.mainModule.filename = __dirname + "/../../../package.json";

    await Imperative.init(myConfig.loadedConfig);
    const loadedDefinitions = Imperative.fullCommandTree;

    let totalCommands = 0;
    let oldCommandName = "";

    function getGroupHelp(definition: any, indentLevel: number = 0) {

        let markdownContent = "";
        markdownContent += definition.description ? definition.description.trim() + "\n" : "";

        for (const child of definition.children) {

            totalCommands++;


            if (child.type !== "command") {
                oldCommandName = " " + definition.name;
                getGroupHelp(child, indentLevel + 1);
                continue;
            }

            // markdownContent += util.format("##%s %s\n", "#".repeat(indentLevel), childNameSummary);

            const helpGen = new DefaultHelpGenerator({
                produceMarkdown: true,
                rootCommandName: Constants.BINARY_NAME + oldCommandName
            } as any, {
                commandDefinition: child,
                fullCommandTree: definition
            });
            markdownContent += helpGen.buildHelp();

            // todo: unique file for each page
            const docPath = path.join(docDir, "test.html");
            fs.writeFileSync(docPath, marked(markdownContent));

            console.log(chalk.blue("doc generated to " + docPath));
        }
        oldCommandName = "";
    }

// --------------------------------------------------------
// Remove duplicates from Imperative.fullCommandTree
    const allDefSoFar: string[] = [];
    const definitionsArray = loadedDefinitions.children.sort((a, b) => a.name.localeCompare(b.name)).filter((cmdDef) => {
        if (allDefSoFar.indexOf(cmdDef.name) === -1) {
            allDefSoFar.push(cmdDef.name);
            return true;
        }
        return false;
    });
// --------------------------------------------------------

    for (const def of definitionsArray) {
        getGroupHelp(def);
    }

    console.log(chalk.blue("Generated documentation pages for " + totalCommands + " commands"));

    process.env.FORCE_COLOR = undefined;
})();
