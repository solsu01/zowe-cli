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
import { Session, TextUtils } from "@brightside/imperative";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import * as fs from "fs";
import { IJob } from "../../../../src/api/doc/response/IJob";
import { TEST_RESOURCES_DIR } from "../../../__src__/ZosJobsTestConstants";
import { join } from "path";
import { SubmitJobs } from "../../../../src/api/SubmitJobs";

// TODO - Add cleanup logic when the properties are available

// Test Environment populated in the beforeAll();
let TEST_ENVIRONMENT: ITestEnvironment;
let IEFBR14_JOB: string;
let REAL_SESSION: Session;
let ACCOUNT: string;
let JOB_NAME: string;
let NON_HELD_JOBCLASS: string;

describe("zos-jobs view spool-file-by-id command", () => {
    // Create the unique test environment
    beforeAll(async () => {
        TEST_ENVIRONMENT = await TestEnvironment.setUp({
            testName: "zos_jobs_view_spool_file_by_id_command",
            tempProfileTypes: ["zosmf"]
        });

        IEFBR14_JOB = TEST_ENVIRONMENT.systemTestProperties.zosjobs.iefbr14Member;
        const systemProps = new TestProperties(TEST_ENVIRONMENT.systemTestProperties);
        const defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = new Session({
            user: defaultSystem.zosmf.user,
            password: defaultSystem.zosmf.pass,
            hostname: defaultSystem.zosmf.host,
            port: defaultSystem.zosmf.port,
            type: "basic",
            rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized
        });

        ACCOUNT = defaultSystem.tso.account;
        const JOB_LENGTH = 6;
        JOB_NAME = REAL_SESSION.ISession.user.substr(0, JOB_LENGTH).toUpperCase() + "SF";
        NON_HELD_JOBCLASS = TEST_ENVIRONMENT.systemTestProperties.zosjobs.jobclass;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
    });

    describe("help", () => {
        it("should not have changed", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/help.sh", TEST_ENVIRONMENT);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toMatchSnapshot();
            expect(response.status).toBe(0);
        });
    });

    describe("syntax errors", () => {
        it("should occur if the jobid and spool file id are missing", async () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/missing_jobid_and_spool_id.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
            expect(response.status).toBe(1);
        });

        it("should occur if the spool file id is missing", async () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/missing_spool_id.sh", TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.stderr.toString()).toMatchSnapshot();
            expect(response.status).toBe(1);
        });
    });

    describe("response", () => {
        it("should be able to get the content of every spool file for a job", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/get_all_spool_content.sh",
                TEST_ENVIRONMENT, [IEFBR14_JOB]);
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("!!!SPOOL FILE");
            expect(response.stdout.toString()).toContain("PGM=IEFBR14");
        });

        it("should be able to view the contents of the requested DD", async () => {
            // Construct the JCL
            const iefbr14Jcl = fs.readFileSync(join(TEST_RESOURCES_DIR, "jcl/multiple_procs.jcl")).toString();
            const renderedJcl = TextUtils.renderWithMustache(iefbr14Jcl,
                {JOBNAME: JOB_NAME, ACCOUNT, JOBCLASS: NON_HELD_JOBCLASS});

            // Submit the job
            const job: IJob = await SubmitJobs.submitJclNotify(REAL_SESSION, renderedJcl);

            // View the DDs
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/get_systsprt_dd.sh",
                TEST_ENVIRONMENT, [job.jobid]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("!!!SPOOL FILE!!!");
            expect(response.stdout.toString()).toContain("OUTPUT FROM PROC1");
            expect(response.stdout.toString()).toContain("OUTPUT FROM PROC2");
            expect(response.status).toBe(0);
        });
    });

    describe("error handling", () => {
        it("should surface an error from z/OSMF if the jobid doesn't exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/jobid_does_not_exist.sh",
                TEST_ENVIRONMENT);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("Obtaining job info for a single job id J0 on");
            expect(response.stderr.toString()).toContain("failed: Job not found");
        });

        it("should surface an error if the spool file ID does not exist", () => {
            const response = runCliScript(__dirname + "/__scripts__/spool-file-by-id/spool_file_does_not_exist.sh",
                TEST_ENVIRONMENT, [IEFBR14_JOB]);
            expect(response.stdout.toString()).toBe("");
            expect(response.status).toBe(1);
            expect(response.stderr.toString()).toContain("Command Error:");
            expect(response.stderr.toString()).toContain("z/OSMF REST API Error:");
            expect(response.stderr.toString()).toContain("does not contain spool file id 9999");
            expect(response.stderr.toString()).toContain("Error Details:");
            expect(response.stderr.toString()).toContain("Request: GET");
        });
    });
});