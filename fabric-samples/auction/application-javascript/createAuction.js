/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPApple, buildCCPFiserv, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const myChannel = 'mychannel';
const myChaincodeName = 'auction';


function prettyJSONString(inputString) {
    if (inputString) {
        return JSON.stringify(JSON.parse(inputString), null, 2);
    }
    else {
        return inputString;
    }
}

async function createAuction(ccp,wallet,user,auctionID,item) {
    try {

        const gateway = new Gateway();
      //connect using Discovery enabled

      await gateway.connect(ccp,
          { wallet: wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork(myChannel);
        const contract = network.getContract(myChaincodeName);

        let statefulTxn = contract.createTransaction('CreateAuction');

        console.log('\n--> Submit Transaction: Propose a new auction');
        await statefulTxn.submit(auctionID,item);
        console.log('*** Result: committed');

        console.log('\n--> Evaluate Transaction: query the auction that was just created');
        let result = await contract.evaluateTransaction('QueryAuction',auctionID);
        console.log('*** Result: Auction: ' + prettyJSONString(result.toString()));

        gateway.disconnect();
    } catch (error) {
        console.error(`******** FAILED to submit bid: ${error}`);
	}
}

async function main() {
    try {

        if (process.argv[2] == undefined || process.argv[3] == undefined
            || process.argv[4] == undefined || process.argv[5] == undefined) {
            console.log("Usage: node createAuction.js org userID auctionID item");
            process.exit(1);
        }

        const org = process.argv[2]
        const user = process.argv[3];
        const auctionID = process.argv[4];
        const item = process.argv[5];

        if (org == 'Apple' || org == 'apple') {

            const orgMSP = 'AppleMSP';
            const ccp = buildCCPApple();
            const walletPath = path.join(__dirname, 'wallet/apple');
            const wallet = await buildWallet(Wallets, walletPath);
            await createAuction(ccp,wallet,user,auctionID,item);
        }
        else if (org == 'Fiserv' || org == 'fiserv') {

            const orgMSP = 'FiservMSP';
            const ccp = buildCCPFiserv();
            const walletPath = path.join(__dirname, 'wallet/fiserv');
            const wallet = await buildWallet(Wallets, walletPath);
            await createAuction(ccp,wallet,user,auctionID,item);
        }  else {
            console.log("Usage: node createAuction.js org userID auctionID item");
            console.log("Org must be Apple or Fiserv");
          }
    } catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
    }
}


main();
