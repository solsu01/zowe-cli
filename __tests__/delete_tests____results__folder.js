/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

/**
 * script to remove folders/files from __tests__\__results__ folder and delete __results__
 * avoids the build up of unneeded folders/files
 */

const fs = require('fs');
const rimraf = require('rimraf');
let currentDirectory = process.cwd();

removeDirectories(currentDirectory + "/__tests__/__results__");

function removeDirectories(dirPath) {
    try {
      if (fs.existsSync(dirPath)) {
        rimraf(dirPath, function () {
          //fs.mkdirSync(dirPath);  // currently not re-creating
          console.log("Cleaning of " + dirPath + " folder done");
        });
      }
      else {
        console.log(dirPath + " not found");
      }
    }
    catch(e) {
      console.log(e.message);
      return;
    }
  }