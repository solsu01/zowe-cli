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

import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "../../../../../../../__tests__/__src__/TestUtils";
import * as fs from "fs";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { Session } from "@brightside/imperative";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { ListRegistryInstances } from "../../../../../";
import { ProvisioningConstants } from "../../../../../index";

let TEST_ENVIRONMENT: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;
let REAL_SESSION: Session;
const TIMEOUT = 30000;

describe("provisioning list instance-variables", () => {

    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "provisioning_list_instance-info",
            tempProfileTypes: ["zosmf"]
        });
        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });
    });

    it("should display the help", async () => {
        const response = runCliScript(__dirname + "/__scripts__/instanceVariables_help.sh", TEST_ENVIRONMENT);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(response.stdout.toString()).toMatchSnapshot();
    });
    it("should display instance info(expects first instance in registry to have variables)", async () => {
        const instance = (await ListRegistryInstances.listRegistryCommon(REAL_SESSION, ProvisioningConstants.ZOSMF_VERSION))["scr-list"]
            .pop()["external-name"];
        const regex = fs.readFileSync(__dirname + "/__regex__/instance_variables_response.regex").toString();
        const response = runCliScript(__dirname + "/__scripts__/instanceVariables.sh", TEST_ENVIRONMENT, [instance]);
        expect(response.stderr.toString()).toBe("");
        expect(response.status).toBe(0);
        expect(new RegExp(regex, "g").test(response.stdout.toString())).toBe(true);
    }, TIMEOUT);
});