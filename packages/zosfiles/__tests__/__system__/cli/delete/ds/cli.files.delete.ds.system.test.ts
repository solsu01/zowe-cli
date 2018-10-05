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
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let dsname: string;
let dsnameSuffix: string;
let user: string;

describe("Delete Data Set", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_delete_data_set"
        });

        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized,
        });

        user = defaultSystem.zosmf.user.trim().toUpperCase();
        dsname = `${user}.TEST.DATA.SET`;

    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {

        beforeEach(async () => {
            dsnameSuffix = "";  // reset
        });

        it("should display delete data-set help", async () => {
            const response = runCliScript(__dirname + "/__scripts__/delete_data_set_help.sh",
                testEnvironment);
            expect(response.status).toBe(0);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should delete a data set", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_create_data_set.sh",
                testEnvironment, [dsname]);
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
                testEnvironment, [dsname, "--for-sure"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });

        it("should delete a partitioned data set and print attributes", async () => {
            let response = runCliScript(__dirname + "/__scripts__/command/command_create_data_set.sh",
                testEnvironment, [dsname]);
            response = runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
                testEnvironment, [dsname, "--for-sure", "--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("Expected failures", () => {

        it("should fail deleting a data set due to missing data set name", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
                testEnvironment, [""]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("dataSetName");
            expect(response.stderr.toString()).toContain("Missing Positional");
        });

        it("should fail deleting a data set without specifying --for-sure", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
                testEnvironment, [dsname]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("--for-sure");
            expect(response.stderr.toString()).toContain("Missing Required Option");
        });

        it("should fail deleting a data set that does not exist", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/command_delete_data_set.sh",
                testEnvironment, [user + ".does.not.exist", "--for-sure"]);
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Data set not cataloged ");
        });
    });
});