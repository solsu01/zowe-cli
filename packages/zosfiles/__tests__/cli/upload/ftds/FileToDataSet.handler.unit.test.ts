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

import { Upload } from "../../../../src/api/methods/upload";

describe("Upload file-to-data-set handler", () => {
    describe("process method", () => {
        it("should upload a file to a data set if requested", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/upload/ftds/FileToDataSet.handler");
            const handler = new handlerReq.default();
            const inputfile = "test-file";
            const dataSetName = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.fileToDataset = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded",
                    apiResponse: [
                        { success: true, from: inputfile, to: dataSetName }
                    ]
                };
            });

            // Mocked function references
            const profFunc = jest.fn((args) => {
                return {
                    host: "fake",
                    port: "fake",
                    user: "fake",
                    pass: "fake",
                    auth: "fake",
                    rejectUnauthorized: "fake",
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputfile,
                        dataSetName
                    },
                    response: {
                        data: {
                            setMessage: jest.fn((setMsgArgs) => {
                                apiMessage = setMsgArgs;
                            }),
                            setObj: jest.fn((setObjArgs) => {
                                jsonObj = setObjArgs;
                            })
                        },
                        console: {
                            log: jest.fn((logArgs) => {
                                logMessage += "\n" + logArgs;
                            })
                        }
                    },
                    profiles: {
                        get: profFunc
                    }
                } as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeUndefined();
            expect(profFunc).toHaveBeenCalledWith("zosmf");
            expect(Upload.fileToDataset).toHaveBeenCalledTimes(1);
            expect(Upload.fileToDataset).toHaveBeenCalledWith(fakeSession, inputfile, dataSetName, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
        it("should display error when upload file to data set", async () => {
            // Require the handler and create a new instance
            const handlerReq = require("../../../../src/cli/upload/ftds/FileToDataSet.handler");
            const handler = new handlerReq.default();
            const inputfile = "test-file";
            const dataSetName = "testing";

            // Vars populated by the mocked function
            let error;
            let apiMessage = "";
            let jsonObj;
            let logMessage = "";
            let fakeSession = null;

            // Mock the submit JCL function
            Upload.fileToDataset = jest.fn((session) => {
                fakeSession = session;
                return {
                    success: true,
                    commandResponse: "uploaded",
                    apiResponse: [
                        { success: false, from: inputfile, to: dataSetName }
                    ]
                };
            });

            // Mocked function references
            const profFunc = jest.fn((args) => {
                return {
                    host: "fake",
                    port: "fake",
                    user: "fake",
                    pass: "fake",
                    auth: "fake",
                    rejectUnauthorized: "fake",
                };
            });

            try {
                // Invoke the handler with a full set of mocked arguments and response functions
                await handler.process({
                    arguments: {
                        $0: "fake",
                        _: ["fake"],
                        inputfile,
                        dataSetName
                    },
                    response: {
                        data: {
                            setMessage: jest.fn((setMsgArgs) => {
                                apiMessage = setMsgArgs;
                            }),
                            setObj: jest.fn((setObjArgs) => {
                                jsonObj = setObjArgs;
                            })
                        },
                        console: {
                            log: jest.fn((logArgs) => {
                                logMessage += "\n" + logArgs;
                            })
                        }
                    },
                    profiles: {
                        get: profFunc
                    }
                } as any);
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(profFunc).toHaveBeenCalledWith("zosmf");
            expect(Upload.fileToDataset).toHaveBeenCalledTimes(1);
            expect(Upload.fileToDataset).toHaveBeenCalledWith(fakeSession, inputfile, dataSetName, {});
            expect(jsonObj).toMatchSnapshot();
            expect(apiMessage).toMatchSnapshot();
            expect(logMessage).toMatchSnapshot();
        });
    });
});