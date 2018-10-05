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

import { ImperativeError, Session } from "@brightside/imperative";
import { ZosmfRestClient } from "../../../../../rest";
import { List } from "../../../../src/api/methods/list/List";
import { ZosFilesMessages } from "../../../../src/api/constants/ZosFiles.messages";
import { posix } from "path";
import { ZosFilesConstants } from "../../../../src/api/constants/ZosFiles.constants";
import { ZosmfHeaders } from "../../../../../rest/src/ZosmfHeaders";

describe("z/OS Files - List", () => {
    const expectJsonSpy = jest.spyOn(ZosmfRestClient, "getExpectJSON");
    const dsname = "USER.DATA.SET";
    const listApiResponse = {
        items: [
            {member: "m1"},
            {member: "m2"}
        ]
    };

    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    describe("allMembers", () => {
        beforeEach(() => {
            expectJsonSpy.mockClear();
            expectJsonSpy.mockImplementation(() => listApiResponse);
        });

        it("should throw an error if the data set name is not specified", async () => {
            let response;
            let caughtError;

            // Test for NULL
            try {
                response = await List.allMembers(dummySession, null);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;
            // Test for UNDEFINED
            try {
                response = await List.allMembers(dummySession, undefined);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);

            caughtError = undefined;
            // Test for EMPTY
            try {
                response = await List.allMembers(dummySession, "");
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should indicate that the data set is empty", async () => {
            let response;
            let caughtError;

            expectJsonSpy.mockResolvedValueOnce({items: []});

            try {
                response = await List.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname, ZosFilesConstants.RES_DS_MEMBERS);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: null,
                apiResponse: {items: []}
            });
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should list members from given data set", async () => {
            let response;
            let caughtError;

            try {
                response = await List.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname, ZosFilesConstants.RES_DS_MEMBERS);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: null,
                apiResponse: listApiResponse
            });
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should list members from given data set with additional attributes", async () => {
            let response;
            let caughtError;

            try {
                response = await List.allMembers(dummySession, dsname, {
                    attributes: true
                });
            } catch (e) {
                caughtError = e;
            }

            const endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_DS_FILES, dsname, ZosFilesConstants.RES_DS_MEMBERS);

            expect(caughtError).toBeUndefined();
            expect(response).toEqual({
                success: true,
                commandResponse: null,
                apiResponse: listApiResponse
            });
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_ATTRIBUTES_BASE, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should handle a Zosmf REST client error", async () => {
            let response;
            let caughtError;

            const dummyError = new Error("test");
            expectJsonSpy.mockImplementationOnce(() => {
                throw dummyError;
            });

            try {
                response = await List.allMembers(dummySession, dsname);
            } catch (e) {
                caughtError = e;
            }

            expect(response).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError).toEqual(dummyError);
        });
    });

    describe("dataSet", () => {
        beforeEach(() => {
            expectJsonSpy.mockClear();
            expectJsonSpy.mockImplementation(() => listApiResponse);
        });

        it("should throw error when data set name is not specified", async () => {
            let response;
            let error;

            try {
                response = await List.dataSet(dummySession, undefined);
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should throw error when data set name is empty", async () => {
            let response;
            let error;

            try {
                response = await List.dataSet(dummySession, "");
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error.message).toContain(ZosFilesMessages.missingDatasetName.message);
        });

        it("should throw error when zosmfRestClient.getExpectJSON error", async () => {
            let response;
            let error;
            const testError = new ImperativeError({
                msg: "test error"
            });

            expectJsonSpy.mockRejectedValueOnce(testError);

            try {
                response = await List.dataSet(dummySession, dsname);
            } catch (err) {
                error = err;
            }

            expect(response).toBeFalsy();
            expect(error).toBeTruthy();
            expect(error).toBe(testError);
        });

        it("should indicate that the data set was not found", async () => {
            let response;
            let error;
            const testApiResponse: any = {
                items: []
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.dataSet(dummySession, dsname);
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should return with data when input data set name is valid", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: ["test"]
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.dataSet(dummySession, dsname);
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });

        it("should return with data when specify attribute option", async () => {
            let response;
            let error;
            const testApiResponse = {
                items: ["test"]
            };
            const endpoint = posix.join(ZosFilesConstants.RESOURCE,
                `${ZosFilesConstants.RES_DS_FILES}?${ZosFilesConstants.RES_DS_LEVEL}=${dsname}`);

            expectJsonSpy.mockResolvedValue(testApiResponse);

            try {
                response = await List.dataSet(dummySession, dsname, {attributes: true});
            } catch (err) {
                error = err;
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(response.success).toBeTruthy();
            expect(response.commandResponse).toBe(null);
            expect(response.apiResponse).toBe(testApiResponse);
            expect(expectJsonSpy).toHaveBeenCalledTimes(1);
            expect(expectJsonSpy).toHaveBeenCalledWith(dummySession, endpoint, [ZosmfHeaders.X_IBM_ATTRIBUTES_BASE, ZosmfHeaders.X_IBM_MAX_ITEMS]);
        });
    });
});