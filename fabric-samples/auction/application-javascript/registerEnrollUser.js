/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPApple, buildCCPFiserv, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const mspApple = 'AppleMSP';
const mspFiserv = 'FiservMSP';

function prettyJSONString(inputString) {
    if (inputString) {
        return JSON.stringify(JSON.parse(inputString), null, 2);
    }
    else {
        return inputString;
    }
}

async function connectToAppleCA(UserID) {
    console.log('\n--> Register and enrolling new user');
    const ccpApple = buildCCPApple();
    const caAppleClient = buildCAClient(FabricCAServices, ccpApple, 'ca.apple.example.com');

    const walletPathApple = path.join(__dirname, 'wallet/apple');
    const walletApple = await buildWallet(Wallets, walletPathApple);

    await registerAndEnrollUser(caAppleClient, walletApple, mspApple, UserID, 'apple.department1');

}

async function connectToFiservCA(UserID) {
    console.log('\n--> Register and enrolling new user');
    const ccpFiserv = buildCCPFiserv();
    const caFiservClient = buildCAClient(FabricCAServices, ccpFiserv, 'ca.fiserv.example.com');

    const walletPathFiserv = path.join(__dirname, 'wallet/fiserv');
    const walletFiserv = await buildWallet(Wallets, walletPathFiserv);

    await registerAndEnrollUser(caFiservClient, walletFiserv, mspFiserv, UserID, 'fiserv.department1');

}
async function main() {

    if (process.argv[2] == undefined && process.argv[3] == undefined) {
        console.log("Usage: node registerEnrollUser.js org userID");
        process.exit(1);
    }

    const org = process.argv[2];
    const userId = process.argv[3];

    try {

      if (org == 'Apple' || org == 'apple') {
        await connectToAppleCA(userId);
      }
      else if (org == 'Fiserv' || org == 'fiserv') {
        await connectToFiservCA(userId);
      } else {
        console.log("Usage: node registerEnrollUser.js org userID");
        console.log("Org must be Apple or Fiserv");
      }
    } catch (error) {
        console.error(`Error in enrolling admin: ${error}`);
        process.exit(1);
    }
}

main();
