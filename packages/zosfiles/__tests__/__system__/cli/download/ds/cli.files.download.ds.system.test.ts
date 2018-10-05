/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { Session } from "@brightside/imperative";
import * as path from "path";
import { runCliScript, getUniqueDatasetName } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { Create, CreateDataSetTypeEnum, Delete } from "../../../../../../zosfiles";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;


describe("Download Data Set", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "download_data_set"
        });

        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });

        dsname = getUniqueDatasetName(defaultSystem.zosmf.user);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe ("Success scenarios", () => {
        beforeEach(async () => {
            try {
                await Create.dataSet(REAL_SESSION, CreateDataSetTypeEnum.DATA_SET_PARTITIONED, dsname);
            } catch (err) {
                throw err;
            }
        });

        afterEach( async () => {
            try {
                await Delete.dataSet(REAL_SESSION, dsname);
            } catch (err) {
                throw err;
            }
        });

        it("should display download data set help", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command_download_data_set_help.sh");
            const response = runCliScript(shellScript, testEnvironment);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should download data set", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, testEnvironment, [dsname]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
        });

        it("should download data set with response-format-json flag", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, testEnvironment, [dsname, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
        });

        it("should download data set to a specified file name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const fileName = "testFile.txt";
            const response = runCliScript(shellScript, testEnvironment, [dsname, `-f ${fileName}`, "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Data set downloaded successfully.");
            expect(response.stdout.toString()).toContain(fileName);
        });
    });

    describe("Expected failures", () => {
        it("should fail due to missing data set name", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, testEnvironment, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Missing Positional Option");
            expect(response.stderr.toString()).toContain("dataSetName");
        });

        it("should fail due to specified data set name does not existed", async () => {
            const shellScript = path.join(__dirname, "__scripts__", "command", "command_download_data_set.sh");
            const response = runCliScript(shellScript, testEnvironment, [dsname + ".dummy"]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Data set not found.");
        });
    });
});