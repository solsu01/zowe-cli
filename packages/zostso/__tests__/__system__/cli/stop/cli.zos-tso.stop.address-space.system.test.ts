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

import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import * as fs from "fs";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../../__tests__/__src__/TestUtils";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
describe("zos-tso start address-space", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_tso_start_as",
            tempProfileTypes: ["zosmf", "tso"]
        });
    });
    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/address-space/address_space_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });

    it("should throw an error if servlet key parameter is not provided", async () => {
        const response = runCliScript(__dirname + "/__scripts__/address-space/as_error_stop.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toBe("");
        expect(response.stderr.toString()).toMatchSnapshot();
    });

    it("should throw an error if provided address space is inactive", async () => {
        const response = runCliScript(__dirname + "/__scripts__/address-space/as_error_stop.sh", TEST_ENVIRONMENT);
        expect(response.status).toBe(1);
        expect(response.stdout.toString()).toBe("");
        expect(response.stderr.toString()).toMatchSnapshot();
    });

    it("should successfully issue the command", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/as_stop_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/address-space/as_success_stop.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

    it("should complete the command successfully and return a valid JSON response", async () => {
        const regex = fs.readFileSync(__dirname + "/__regex__/as_stop_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/address-space/as_success_stop_rfj.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);

        // Convert response to an object and check fields
        const respObj = JSON.parse(response.stdout.toString());
        expect(respObj.success).toBe(true);
        expect(respObj.message).toBe("");
        expect(respObj.stderr).toBe("");
        expect(respObj.error).toBeUndefined();
        expect(respObj.data.servletKey).toBeDefined();
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    });

});