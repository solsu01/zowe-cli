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

import { ITestEnvironment } from "./../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "./../../../../../../__tests__/__src__/environment/TestEnvironment";
import { runCliScript } from "./../../../../../../__tests__/__src__/TestUtils";
import { ICommandResponse } from "@brightside/imperative";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;

// Pulled from test properties file
let account: string;
let defaultSystem: ITestSystemSchema;
let systemProps: TestProperties;
let jclMember: string;
let psJclDataSet: string;

describe("zos-jobs view job-status-by-jobid command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_view_job_status_by_jobid_command",
            tempProfileTypes: ["zosmf"]
        });

        systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        account = defaultSystem.tso.account;
        jclMember = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
        psJclDataSet = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14PSDataSet;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("help", () => {
        it("should not have changed", () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/job_help.sh",
                TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toMatchSnapshot();
        });
    });

    describe("response", () => {
        it("should contain the jobid, jobname, cc, and status", () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/submit_and_view.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("jobname:");
            expect(response.stdout.toString()).toContain("jobid:");
            expect(response.stdout.toString()).toContain("status:");
            expect(response.stdout.toString()).toContain("retcode:");
        });

        it("should be able to submit the job then view the job and the details should match", () => {

            // Submit the job and parse the response
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/submit_rfj.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const submitJson: ICommandResponse = JSON.parse(response.stdout.toString());
            expect(submitJson.success).toBe(true);

            // View the job
            const viewResponse = runCliScript(__dirname +
                "/__scripts__/job-status-by-jobid/view_rfj.sh", TEST_ENVIRONMENT, [submitJson.data.jobid]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            const viewJson: ICommandResponse = JSON.parse(response.stdout.toString());
            expect(viewJson.success).toBe(true);
            expect(viewJson.data.jobid).toBe(submitJson.data.jobid);
            expect(viewJson.data.jobname).toBe(submitJson.data.jobname);
        });

        it("should contain the status of OUTPUT", () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/submit_and_wait_for_output.sh",
                TEST_ENVIRONMENT, [jclMember]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("OUTPUT");
        });
    });

    describe("syntax errors", () => {
        it("should occur if the jobid is missing", async () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/job_syntax_missing_jobid.sh",
                TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toMatchSnapshot();
        });

        it("should occur if an extra unknown option is specified", async () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/job_syntax_invalid_parm.sh",
                TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toMatchSnapshot();
        });
    });

    describe("error handling", () => {
        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/job-status-by-jobid/jobid_doesnt_exist.sh",
                TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("Obtaining job info for a single job id J0 on");
            expect(response.stderr.toString()).toContain("failed: Job not found");
        });
    });
});