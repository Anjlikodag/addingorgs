/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPApple, buildCCPFiserv, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const myChannel = 'mychannel';
const myChaincodeName = 'private';

const memberAssetCollectionName = 'assetCollection';
const applePrivateCollectionName = 'AppleMSPPrivateCollection';
const fiservPrivateCollectionName = 'FiservMSPPrivateCollection';
const mspApple = 'AppleMSP';
const mspFiserv = 'FiservMSP';
const AppleUserId = 'appUser1';
const FiservUserId = 'appUser2';

const RED = '\x1b[31m\n';
const RESET = '\x1b[0m';

function prettyJSONString(inputString) {
    if (inputString) {
        return JSON.stringify(JSON.parse(inputString), null, 2);
    }
    else {
        return inputString;
    }
}

function doFail(msgString) {
    console.error(`${RED}\t${msgString}${RESET}`);
    process.exit(1);
}

function verifyAssetData(org, resultBuffer, expectedId, color, size, ownerUserId, appraisedValue) {

    let asset;
    if (resultBuffer) {
        asset = JSON.parse(resultBuffer.toString('utf8'));
    } else {
        doFail('Failed to read asset');
    }
    console.log(`*** verify asset data for: ${expectedId}`);
    if (!asset) {
        doFail('Received empty asset');
    }
    if (expectedId !== asset.assetID) {
        doFail(`recieved asset ${asset.assetID} , but expected ${expectedId}`);
    }
    if (asset.color !== color) {
        doFail(`asset ${asset.assetID} has color of ${asset.color}, expected value ${color}`);
    }
    if (asset.size !== size) {
        doFail(`Failed size check - asset ${asset.assetID} has size of ${asset.size}, expected value ${size}`);
    }

    if (asset.owner.includes(ownerUserId)) {
        console.log(`\tasset ${asset.assetID} owner: ${asset.owner}`);
    } else {
        doFail(`Failed owner check from ${org} - asset ${asset.assetID} owned by ${asset.owner}, expected userId ${ownerUserId}`);
    }
    if (appraisedValue) {
        if (asset.appraisedValue !== appraisedValue) {
            doFail(`Failed appraised value check from ${org} - asset ${asset.assetID} has appraised value of ${asset.appraisedValue}, expected value ${appraisedValue}`);
        }
    }
}

function verifyAssetPrivateDetails(resultBuffer, expectedId, appraisedValue) {
    let assetPD;
    if (resultBuffer) {
        assetPD = JSON.parse(resultBuffer.toString('utf8'));
    } else {
        doFail('Failed to read asset private details');
    }
    console.log(`*** verify private details: ${expectedId}`);
    if (!assetPD) {
        doFail('Received empty data');
    }
    if (expectedId !== assetPD.assetID) {
        doFail(`recieved ${assetPD.assetID} , but expected ${expectedId}`);
    }

    if (appraisedValue) {
        if (assetPD.appraisedValue !== appraisedValue) {
            doFail(`Failed appraised value check - asset ${assetPD.assetID} has appraised value of ${assetPD.appraisedValue}, expected value ${appraisedValue}`);
        }
    }
}

async function initContractFromAppleIdentity() {
    console.log('\n--> Fabric client user & Gateway init: Using Apple identity to Apple Peer');
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccpApple = buildCCPApple();

    // build an instance of the fabric ca services client based on
    // the information in the network configuration
    const caAppleClient = buildCAClient(FabricCAServices, ccpApple, 'ca.apple.example.com');

    // setup the wallet to cache the credentials of the application user, on the app server locally
    const walletPathApple = path.join(__dirname, 'wallet/apple');
    const walletApple = await buildWallet(Wallets, walletPathApple);

    // in a real application this would be done on an administrative flow, and only once
    // stores admin identity in local wallet, if needed
    await enrollAdmin(caAppleClient, walletApple, mspApple);
    // register & enroll application user with CA, which is used as client identify to make chaincode calls
    // and stores app user identity in local wallet
    // In a real application this would be done only when a new user was required to be added
    // and would be part of an administrative flow
    await registerAndEnrollUser(caAppleClient, walletApple, mspApple, AppleUserId, 'apple.department1');

    try {
        // Create a new gateway for connecting to Org's peer node.
        const gatewayApple = new Gateway();
        //connect using Discovery enabled
        await gatewayApple.connect(ccpApple,
            { wallet: walletApple, identity: AppleUserId, discovery: { enabled: true, asLocalhost: true } });

        return gatewayApple;
    } catch (error) {
        console.error(`Error in connecting to gateway: ${error}`);
        process.exit(1);
    }
}

async function initContractFromFiservIdentity() {
    console.log('\n--> Fabric client user & Gateway init: Using Fiserv identity to Fiserv Peer');
    const ccpFiserv = buildCCPFiserv();
    const caFiservClient = buildCAClient(FabricCAServices, ccpFiserv, 'ca.fiserv.example.com');

    const walletPathFiserv = path.join(__dirname, 'wallet/fiserv');
    const walletFiserv = await buildWallet(Wallets, walletPathFiserv);

    await enrollAdmin(caFiservClient, walletFiserv, mspFiserv);
    await registerAndEnrollUser(caFiservClient, walletFiserv, mspFiserv, FiservUserId, 'fiserv.department1');

    try {
        // Create a new gateway for connecting to Org's peer node.
        const gatewayFiserv = new Gateway();
        await gatewayFiserv.connect(ccpFiserv,
            { wallet: walletFiserv, identity: FiservUserId, discovery: { enabled: true, asLocalhost: true } });

        return gatewayFiserv;
    } catch (error) {
        console.error(`Error in connecting to gateway: ${error}`);
        process.exit(1);
    }
}

// Main workflow : usecase details at asset-transfer-private-data/chaincode-go/README.md
// This app uses fabric-samples/test-network based setup and the companion chaincode
// For this usecase illustration, we will use both Apple & Fiserv client identity from this same app
// In real world the Apple & Fiserv identity will be used in different apps to achieve asset transfer.
async function main() {
    try {

        /** ******* Fabric client init: Using Apple identity to Apple Peer ********** */
        const gatewayApple = await initContractFromAppleIdentity();
        const networkApple = await gatewayApple.getNetwork(myChannel);
        const contractApple = networkApple.getContract(myChaincodeName);
        // Since this sample chaincode uses, Private Data Collection level endorsement policy, addDiscoveryInterest
        // scopes the discovery service further to use the endorsement policies of collections, if any
        contractApple.addDiscoveryInterest({ name: myChaincodeName, collectionNames: [memberAssetCollectionName, applePrivateCollectionName] });

        /** ~~~~~~~ Fabric client init: Using Fiserv identity to Fiserv Peer ~~~~~~~ */
        const gatewayFiserv = await initContractFromFiservIdentity();
        const networkFiserv = await gatewayFiserv.getNetwork(myChannel);
        const contractFiserv = networkFiserv.getContract(myChaincodeName);
        contractFiserv.addDiscoveryInterest({ name: myChaincodeName, collectionNames: [memberAssetCollectionName, fiservPrivateCollectionName] });
        try {
            // Sample transactions are listed below
            // Add few sample Assets & transfers one of the asset from Apple to Fiserv as the new owner
            let randomNumber = Math.floor(Math.random() * 1000) + 1;
            // use a random key so that we can run multiple times
            let assetID1 = `asset${randomNumber}`;
            let assetID2 = `asset${randomNumber + 1}`;
            const assetType = 'ValuableAsset';
            let result;
            let asset1Data = { objectType: assetType, assetID: assetID1, color: 'green', size: 20, appraisedValue: 100 };
            let asset2Data = { objectType: assetType, assetID: assetID2, color: 'blue', size: 35, appraisedValue: 727 };

            console.log('\n**************** As Apple Client ****************');
            console.log('Adding Assets to work with:\n--> Submit Transaction: CreateAsset ' + assetID1);
            let statefulTxn = contractApple.createTransaction('CreateAsset');
            //if you need to customize endorsement to specific set of Orgs, use setEndorsingOrganizations
            //statefulTxn.setEndorsingOrganizations(mspApple);
            let tmapData = Buffer.from(JSON.stringify(asset1Data));
            statefulTxn.setTransient({
                asset_properties: tmapData
            });
            result = await statefulTxn.submit();

            //Add asset2
            console.log('\n--> Submit Transaction: CreateAsset ' + assetID2);
            statefulTxn = contractApple.createTransaction('CreateAsset');
            tmapData = Buffer.from(JSON.stringify(asset2Data));
            statefulTxn.setTransient({
                asset_properties: tmapData
            });
            result = await statefulTxn.submit();


            console.log('\n--> Evaluate Transaction: GetAssetByRange asset0-asset9');
            // GetAssetByRange returns assets on the ledger with ID in the range of startKey (inclusive) and endKey (exclusive)
            result = await contractApple.evaluateTransaction('GetAssetByRange', 'asset0', 'asset9');
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            if (!result || result.length === 0) {
                doFail('recieved empty query list for GetAssetByRange');
            }
            console.log('\n--> Evaluate Transaction: ReadAssetPrivateDetails from ' + applePrivateCollectionName);
            // ReadAssetPrivateDetails reads data from Org's private collection. Args: collectionName, assetID
            result = await contractApple.evaluateTransaction('ReadAssetPrivateDetails', applePrivateCollectionName, assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetPrivateDetails(result, assetID1, 100);

            // Attempt Transfer the asset to Fiserv , without Fiserv adding AgreeToTransfer //
            // Transaction should return an error: "failed transfer verification ..."
            let buyerDetails = { assetID: assetID1, buyerMSP: mspFiserv };
            try {
                console.log('\n--> Attempt Submit Transaction: TransferAsset ' + assetID1);
                statefulTxn = contractApple.createTransaction('TransferAsset');
                tmapData = Buffer.from(JSON.stringify(buyerDetails));
                statefulTxn.setTransient({
                    asset_owner: tmapData
                });
                result = await statefulTxn.submit();
                console.log('******** FAILED: above operation expected to return an error');
            } catch (error) {
                console.log(`   Successfully caught the error: \n    ${error}`);
            }
            console.log('\n~~~~~~~~~~~~~~~~ As Fiserv Client ~~~~~~~~~~~~~~~~');
            console.log('\n--> Evaluate Transaction: ReadAsset ' + assetID1);
            result = await contractFiserv.evaluateTransaction('ReadAsset', assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetData(mspFiserv, result, assetID1, 'green', 20, AppleUserId);


            // Fiserv cannot ReadAssetPrivateDetails from Apple's private collection due to Collection policy
            //    Will fail: await contractFiserv.evaluateTransaction('ReadAssetPrivateDetails', applePrivateCollectionName, assetID1);

            // Buyer from Fiserv agrees to buy the asset assetID1 //
            // To purchase the asset, the buyer needs to agree to the same value as the asset owner
            let dataForAgreement = { assetID: assetID1, appraisedValue: 100 };
            console.log('\n--> Submit Transaction: AgreeToTransfer payload ' + JSON.stringify(dataForAgreement));
            statefulTxn = contractFiserv.createTransaction('AgreeToTransfer');
            tmapData = Buffer.from(JSON.stringify(dataForAgreement));
            statefulTxn.setTransient({
                asset_value: tmapData
            });
            result = await statefulTxn.submit();

            //Buyer can withdraw the Agreement, using DeleteTranferAgreement
            /*statefulTxn = contractFiserv.createTransaction('DeleteTranferAgreement');
            statefulTxn.setEndorsingOrganizations(mspFiserv);
            let dataForDeleteAgreement = { assetID: assetID1 };
            tmapData = Buffer.from(JSON.stringify(dataForDeleteAgreement));
            statefulTxn.setTransient({
                agreement_delete: tmapData
            });
            result = await statefulTxn.submit();*/

            console.log('\n**************** As Apple Client ****************');
            // All members can send txn ReadTransferAgreement, set by Fiserv above
            console.log('\n--> Evaluate Transaction: ReadTransferAgreement ' + assetID1);
            result = await contractApple.evaluateTransaction('ReadTransferAgreement', assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);

            // Transfer the asset to Fiserv //
            // To transfer the asset, the owner needs to pass the MSP ID of new asset owner, and initiate the transfer
            console.log('\n--> Submit Transaction: TransferAsset ' + assetID1);

            statefulTxn = contractApple.createTransaction('TransferAsset');
            tmapData = Buffer.from(JSON.stringify(buyerDetails));
            statefulTxn.setTransient({
                asset_owner: tmapData
            });
            result = await statefulTxn.submit();

            //Again ReadAsset : results will show that the buyer identity now owns the asset:
            console.log('\n--> Evaluate Transaction: ReadAsset ' + assetID1);
            result = await contractApple.evaluateTransaction('ReadAsset', assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetData(mspApple, result, assetID1, 'green', 20, FiservUserId);

            //Confirm that transfer removed the private details from the Apple collection:
            console.log('\n--> Evaluate Transaction: ReadAssetPrivateDetails');
            // ReadAssetPrivateDetails reads data from Org's private collection: Should return empty
            result = await contractApple.evaluateTransaction('ReadAssetPrivateDetails', applePrivateCollectionName, assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            if (result && result.length > 0) {
                doFail('Expected empty data from ReadAssetPrivateDetails');
            }
            console.log('\n--> Evaluate Transaction: ReadAsset ' + assetID2);
            result = await contractApple.evaluateTransaction('ReadAsset', assetID2);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetData(mspApple, result, assetID2, 'blue', 35, AppleUserId);

            console.log('\n********* Demo deleting asset **************');
            let dataForDelete = { assetID: assetID2 };
            try {
                //Non-owner Fiserv should not be able to DeleteAsset. Expect an error from DeleteAsset
                console.log('--> Attempt Transaction: as Fiserv DeleteAsset ' + assetID2);
                statefulTxn = contractFiserv.createTransaction('DeleteAsset');
                tmapData = Buffer.from(JSON.stringify(dataForDelete));
                statefulTxn.setTransient({
                    asset_delete: tmapData
                });
                result = await statefulTxn.submit();
                console.log('******** FAILED : expected to return an error');
            } catch (error) {
                console.log(`  Successfully caught the error: \n    ${error}`);
            }
            // Delete Asset2 as Apple
            console.log('--> Submit Transaction: as Apple DeleteAsset ' + assetID2);
            statefulTxn = contractApple.createTransaction('DeleteAsset');
            tmapData = Buffer.from(JSON.stringify(dataForDelete));
            statefulTxn.setTransient({
                asset_delete: tmapData
            });
            result = await statefulTxn.submit();

            console.log('\n--> Evaluate Transaction: ReadAsset ' + assetID2);
            result = await contractApple.evaluateTransaction('ReadAsset', assetID2);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            if (result && result.length > 0) {
                doFail('Expected empty read, after asset is deleted');
            }

            console.log('\n~~~~~~~~~~~~~~~~ As Fiserv Client ~~~~~~~~~~~~~~~~');
            // Fiserv can ReadAssetPrivateDetails: Fiserv is owner, and private details exist in new owner's Collection
            console.log('\n--> Evaluate Transaction as Fiserv: ReadAssetPrivateDetails ' + assetID1 + ' from ' + fiservPrivateCollectionName);
            result = await contractFiserv.evaluateTransaction('ReadAssetPrivateDetails', fiservPrivateCollectionName, assetID1);
            console.log(`<-- result: ${prettyJSONString(result.toString())}`);
            verifyAssetPrivateDetails(result, assetID1, 100);
        } finally {
            // Disconnect from the gateway peer when all work for this client identity is complete
            gatewayApple.disconnect();
            gatewayFiserv.disconnect();
        }
    } catch (error) {
        console.error(`Error in transaction: ${error}`);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
