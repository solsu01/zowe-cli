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

import { AbstractSession, ICommandHandler, IHandlerParameters, IProfile, Session } from "@brightside/imperative";
import { IZosFilesResponse } from "../api/doc/IZosFilesResponse";
import { ZosmfSession } from "../../../zosmf";


/**
 * This class is used by the various zosfiles handlers as the base class for their implementation.
 * All handlers within zosfiles should extend this class.
 *
 * This class should not be used outside of the zosfiles package.
 *
 * @private
 */
export abstract class ZosFilesBaseHandler implements ICommandHandler {
    /**
     * This will grab the zosmf profile and create a session before calling the subclass
     * {@link ZosFilesBaseHandler#processWithSession} method.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(commandParameters: IHandlerParameters) {
        const profile = commandParameters.profiles.get("zosmf");
        const session = ZosmfSession.createBasicZosmfSession(profile);

        const response = await this.processWithSession(commandParameters, session, profile);

        // Print out the response
        if (response.commandResponse) {
            commandParameters.response.console.log(response.commandResponse);
        }

        // Return as an object when using --response-format-json
        commandParameters.response.data.setObj(response);
    }

    /**
     * This is called by the {@link ZosFilesBaseHandler#process} after it creates a session. Should
     * be used so that every class under files does not have to instantiate the session object.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent to the handler.
     * @param {AbstractSession} session The session object generated from the zosmf profile.
     * @param {IProfile} zosmfProfile The zosmf profile that was loaded for the command.
     *
     * @returns {Promise<IZosFilesResponse>} The response from the underlying zos-files api call.
     */
    public abstract async processWithSession(
        commandParameters: IHandlerParameters,
        session: AbstractSession,
        zosmfProfile: IProfile
    ): Promise<IZosFilesResponse>;
}