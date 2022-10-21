/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

/**
 * Application that uses implicit private data collections, state-based endorsement,
 * and organization-based ownership and access control to keep data private and securely
 * transfer an asset with the consent of both the current owner and buyer
 *   -- How to submit a transaction
 *   -- How to query
 *   -- How to limit the organizations involved in a transaction
 *
 * To see the SDK workings, try setting the logging to show on the console before running
 *        export HFC_LOGGING='{"debug":"console"}'
 */

// pre-requisites:
// - fabric-sample two organization test-network setup with two peers, ordering service,
//   and 2 certificate authorities
//         ===> from directory /fabric-samples/test-network
//         ./network.sh up createChannel -ca
// - Use the asset-transfer-secured-agreement/chaincode-go chaincode deployed on
//   the channel "mychannel". The following deploy command will package, install,
//   approve, and commit the golang chaincode, all the actions it takes
//   to deploy a chaincode to a channel with the endorsement and private collection
//   settings.
//         ===> from directory /fabric-samples/test-network
//         ./network.sh deployCC -ccn secured -ccp ../asset-transfer-secured-agreement/chaincode-go/ -ccl go -ccep "OR('AppleMSP.peer','FiservMSP.peer')"
//
// - Be sure that node.js is installed
//         ===> from directory /fabric-samples/asset-transfer-secured-agreement/application-javascript
//         node -v
// - npm installed code dependencies
//         ===> from directory /fabric-samples/asset-transfer-secured-agreement/application-javascript
//         npm install
// - to run this test application
//         ===> from directory /fabric-samples/asset-transfer-secured-agreement/application-javascript
//         node app.js

// NOTE: If you see an error like these:
/*

   Error in setup: Error: DiscoveryService: mychannel error: access denied

   OR

   Failed to register user : Error: fabric-ca request register failed with errors [[ { code: 20, message: 'Authentication failure' } ]]

	*/
// Delete the /fabric-samples/asset-transfer-secured-agreement/application-javascript/wallet directory
// and retry this application.
//
// The certificate authority must have been restarted and the saved certificates for the
// admin and application user are not valid. Deleting the wallet store will force these to be reset
// with the new certificate authority.
//

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPApple, buildCCPFiserv, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'secured';

const apple = 'AppleMSP';
const fiserv = 'FiservMSP';
const AppleUserId = 'appUser1';
const FiservUserId = 'appUser2';

const RED = '\x1b[31m\n';
const GREEN = '\x1b[32m\n';
const RESET = '\x1b[0m';

async function initGatewayForApple() {
	console.log(`${GREEN}--> Fabric client user & Gateway init: Using Apple identity to Apple Peer${RESET}`);
	// build an in memory object with the network configuration (also known as a connection profile)
	const ccpApple = buildCCPApple();

	// build an instance of the fabric ca services client based on
	// the information in the network configuration
	const caAppleClient = buildCAClient(FabricCAServices, ccpApple, 'ca.apple.example.com');

	// setup the wallet to cache the credentials of the application user, on the app server locally
	const walletPathApple = path.join(__dirname, 'wallet', 'apple');
	const walletApple = await buildWallet(Wallets, walletPathApple);

	// in a real application this would be done on an administrative flow, and only once
	// stores admin identity in local wallet, if needed
	await enrollAdmin(caAppleClient, walletApple, apple);
	// register & enroll application user with CA, which is used as client identify to make chaincode calls
	// and stores app user identity in local wallet
	// In a real application this would be done only when a new user was required to be added
	// and would be part of an administrative flow
	await registerAndEnrollUser(caAppleClient, walletApple, apple, AppleUserId, 'apple.department1');

	try {
		// Create a new gateway for connecting to Org's peer node.
		const gatewayApple = new Gateway();
		//connect using Discovery enabled
		await gatewayApple.connect(ccpApple,
			{ wallet: walletApple, identity: AppleUserId, discovery: { enabled: true, asLocalhost: true } });

		return gatewayApple;
	} catch (error) {
		console.error(`Error in connecting to gateway for Apple: ${error}`);
		process.exit(1);
	}
}

async function initGatewayForFiserv() {
	console.log(`${GREEN}--> Fabric client user & Gateway init: Using Fiserv identity to Fiserv Peer${RESET}`);
	const ccpFiserv = buildCCPFiserv();
	const caFiservClient = buildCAClient(FabricCAServices, ccpFiserv, 'ca.fiserv.example.com');

	const walletPathFiserv = path.join(__dirname, 'wallet', 'fiserv');
	const walletFiserv = await buildWallet(Wallets, walletPathFiserv);

	await enrollAdmin(caFiservClient, walletFiserv, fiserv);
	await registerAndEnrollUser(caFiservClient, walletFiserv, fiserv, FiservUserId, 'fiserv.department1');

	try {
		// Create a new gateway for connecting to Org's peer node.
		const gatewayFiserv = new Gateway();
		await gatewayFiserv.connect(ccpFiserv,
			{ wallet: walletFiserv, identity: FiservUserId, discovery: { enabled: true, asLocalhost: true } });

		return gatewayFiserv;
	} catch (error) {
		console.error(`Error in connecting to gateway for Fiserv: ${error}`);
		process.exit(1);
	}
}

async function readPrivateAsset(assetKey, org, contract) {
	console.log(`${GREEN}--> Evaluate Transaction: GetAssetPrivateProperties, - ${assetKey} from organization ${org}${RESET}`);
	try {
		const resultBuffer = await contract.evaluateTransaction('GetAssetPrivateProperties', assetKey);
		const asset = JSON.parse(resultBuffer.toString('utf8'));
		console.log(`*** Result: GetAssetPrivateProperties, ${JSON.stringify(asset)}`);

	} catch (evalError) {
		console.log(`*** Failed evaluateTransaction readPrivateAsset: ${evalError}`);
	}
}

async function readBidPrice(assetKey, org, contract) {
	console.log(`${GREEN}--> Evaluate Transaction: GetAssetBidPrice, - ${assetKey} from organization ${org}${RESET}`);
	try {
		const resultBuffer = await contract.evaluateTransaction('GetAssetBidPrice', assetKey);
		const asset = JSON.parse(resultBuffer.toString('utf8'));
		console.log(`*** Result: GetAssetBidPrice, ${JSON.stringify(asset)}`);

	} catch (evalError) {
		console.log(`*** Failed evaluateTransaction GetAssetBidPrice: ${evalError}`);
	}
}

async function readSalePrice(assetKey, org, contract) {
	console.log(`${GREEN}--> Evaluate Transaction: GetAssetSalesPrice, - ${assetKey} from organization ${org}${RESET}`);
	try {
		const resultBuffer = await contract.evaluateTransaction('GetAssetSalesPrice', assetKey);
		const asset = JSON.parse(resultBuffer.toString('utf8'));
		console.log(`*** Result: GetAssetSalesPrice, ${JSON.stringify(asset)}`);

	} catch (evalError) {
		console.log(`*** Failed evaluateTransaction GetAssetSalesPrice: ${evalError}`);
	}
}

function checkAsset(org, resultBuffer, ownerOrg) {
	let asset;
	if (resultBuffer) {
		asset = JSON.parse(resultBuffer.toString('utf8'));
	}

	if (asset) {
		if (asset.ownerOrg === ownerOrg) {
			console.log(`*** Result from ${org} - asset ${asset.assetID} owned by ${asset.ownerOrg} DESC:${asset.publicDescription}`);
		} else {
			console.log(`${RED}*** Failed owner check from ${org} - asset ${asset.assetID} owned by ${asset.ownerOrg} DESC:${asset.publicDescription}${RESET}`);
		}
	}
}

// This is not a real function for an application, this simulates when two applications are running
// from different organizations and what they would see if they were to both query the asset
async function readAssetByBothOrgs(assetKey, ownerOrg, contractApple, contractFiserv) {
	console.log(`${GREEN}--> Evaluate Transactions: ReadAsset, - ${assetKey} should be owned by ${ownerOrg}${RESET}`);
	let resultBuffer;
	resultBuffer = await contractApple.evaluateTransaction('ReadAsset', assetKey);
	checkAsset('Apple', resultBuffer, ownerOrg);
	resultBuffer = await contractFiserv.evaluateTransaction('ReadAsset', assetKey);
	checkAsset('Fiserv', resultBuffer, ownerOrg);
}

// This application uses fabric-samples/test-network based setup and the companion chaincode
// For this illustration, both Apple & Fiserv client identities will be used, however
// notice they are used by two different "gateway"s to simulate two different running
// applications from two different organizations.
async function main() {
	console.log(`${GREEN} **** START ****${RESET}`);
	try {
		const randomNumber = Math.floor(Math.random() * 100) + 1;
		// use a random key so that we can run multiple times
		const assetKey = `asset-${randomNumber}`;

		/** ******* Fabric client init: Using Apple identity to Apple Peer ******* */
		const gatewayApple = await initGatewayForApple();
		const networkApple = await gatewayApple.getNetwork(channelName);
		const contractApple = networkApple.getContract(chaincodeName);

		/** ******* Fabric client init: Using Fiserv identity to Fiserv Peer ******* */
		const gatewayFiserv = await initGatewayForFiserv();
		const networkFiserv = await gatewayFiserv.getNetwork(channelName);
		const contractFiserv = networkFiserv.getContract(chaincodeName);

		try {
			let transaction;

			try {
				// Create an asset by organization Apple, this only requires the owning
				// organization to endorse.
				// With the gateway using discovery, we should limit the organizations used
				// to endorse. This only requires knowledge of the Organizations and not
				// the actual peers that may be active at any given time.
				const asset_properties = {
					object_type: 'asset_properties',
					asset_id: assetKey,
					color: 'blue',
					size: 35,
					salt: Buffer.from(randomNumber.toString()).toString('hex')
				};
				const asset_properties_string = JSON.stringify(asset_properties);
				console.log(`${GREEN}--> Submit Transaction: CreateAsset, ${assetKey} as Apple - endorsed by Apple${RESET}`);
				console.log(`${asset_properties_string}`);
				transaction = contractApple.createTransaction('CreateAsset');
				transaction.setEndorsingOrganizations(apple);
				transaction.setTransient({
					asset_properties: Buffer.from(asset_properties_string)
				});
				await transaction.submit(assetKey, `Asset ${assetKey} owned by ${apple} is not for sale`);
				console.log(`*** Result: committed, asset ${assetKey} is owned by Apple`);
			} catch (createError) {
				console.log(`${RED}*** Failed: CreateAsset - ${createError}${RESET}`);
			}

			// read the public details by both orgs
			await readAssetByBothOrgs(assetKey, apple, contractApple, contractFiserv);
			// Apple should be able to read the private data details of this asset
			await readPrivateAsset(assetKey, apple, contractApple);
			// Fiserv is not the owner and does not have the private details, this should fail
			await readPrivateAsset(assetKey, fiserv, contractFiserv);

			try {
				// This is an update to the public state and requires only the owner to endorse.
				console.log(`${GREEN}--> Submit Transaction: ChangePublicDescription ${assetKey}, as Apple - endorse by Apple${RESET}`);
				transaction = contractApple.createTransaction('ChangePublicDescription');
				transaction.setEndorsingOrganizations(apple);
				await transaction.submit(assetKey, `Asset ${assetKey} owned by ${apple} is for sale`);
				console.log(`*** Result: committed, asset ${assetKey} is now for sale by Apple`);
			} catch (updateError) {
				console.log(`${RED}*** Failed: ChangePublicDescription - ${updateError}${RESET}`);
			}

			// read the public details by both orgs
			await readAssetByBothOrgs(assetKey, apple, contractApple, contractFiserv);

			try {
				// This is an update to the public state and requires the owner(Apple) to endorse and
				// sent by the owner org client (Apple).
				// Since the client is from Fiserv, which is not the owner, this will fail
				console.log(`${GREEN}--> Submit Transaction: ChangePublicDescription ${assetKey}, as Fiserv - endorse by Fiserv${RESET}`);
				transaction = contractFiserv.createTransaction('ChangePublicDescription');
				transaction.setEndorsingOrganizations(fiserv);
				await transaction.submit(assetKey, `Asset ${assetKey} owned by ${fiserv} is NOT for sale`);
				console.log(`${RESET}*** Failed: Fiserv is not the owner and this should have failed${RESET}`);
			} catch (updateError) {
				console.log(`*** Success: ChangePublicDescription has failed endorsememnt by Fiserv sent by Fiserv - ${updateError}`);
			}

			try {
				// This is an update to the public state and requires the owner(Apple) to endorse and
				// sent by the owner org client (Apple).
				// Since this is being sent by Fiserv, which is not the owner, this will fail
				console.log(`${GREEN}--> Submit Transaction: ChangePublicDescription ${assetKey}, as Fiserv - endorse by Apple${RESET}`);
				transaction = contractFiserv.createTransaction('ChangePublicDescription');
				transaction.setEndorsingOrganizations(apple);
				await transaction.submit(assetKey, `Asset ${assetKey} owned by ${fiserv} is NOT for sale`);
				console.log(`${RESET}*** Failed: Fiserv is not the owner and this should have failed${RESET}`);
			} catch (updateError) {
				console.log(`*** Success: ChangePublicDescription has failed endorsement by Apple sent by Fiserv - ${updateError}`);
			}

			// read the public details by both orgs
			await readAssetByBothOrgs(assetKey, apple, contractApple, contractFiserv);

			try {
				// Agree to a sell by Apple
				const asset_price = {
					asset_id: assetKey,
					price: 110,
					trade_id: randomNumber.toString()
				};
				const asset_price_string = JSON.stringify(asset_price);
				console.log(`${GREEN}--> Submit Transaction: AgreeToSell, ${assetKey} as Apple - endorsed by Apple${RESET}`);
				transaction = contractApple.createTransaction('AgreeToSell');
				transaction.setEndorsingOrganizations(apple);
				transaction.setTransient({
					asset_price: Buffer.from(asset_price_string)
				});
				await transaction.submit(assetKey);
				console.log(`*** Result: committed, Apple has agreed to sell asset ${assetKey} for 110`);
			} catch (sellError) {
				console.log(`${RED}*** Failed: AgreeToSell - ${sellError}${RESET}`);
			}

			try {
				// check the private information about the asset from Fiserv
				// Apple would have to send Fiserv these details, so the hash of the
				// details may be checked by the chaincode.
				const asset_properties = {
					object_type: 'asset_properties',
					asset_id: assetKey,
					color: 'blue',
					size: 35,
					salt: Buffer.from(randomNumber.toString()).toString('hex')
				};
				const asset_properties_string = JSON.stringify(asset_properties);
				console.log(`${GREEN}--> Evalute: VerifyAssetProperties, ${assetKey} as Fiserv - endorsed by Fiserv${RESET}`);
				console.log(`${asset_properties_string}`);
				transaction = contractFiserv.createTransaction('VerifyAssetProperties');
				transaction.setTransient({
					asset_properties: Buffer.from(asset_properties_string)
				});
				const verifyResultBuffer = await transaction.evaluate(assetKey);
				if (verifyResultBuffer) {
					const verifyResult = Boolean(verifyResultBuffer.toString());
					if (verifyResult) {
						console.log(`*** Successfully VerifyAssetProperties, private information about asset ${assetKey} has been verified by Fiserv`);
					} else {
						console.log(`*** Failed: VerifyAssetProperties, private information about asset ${assetKey} has not been verified by Fiserv`);
					}
				} else {
					console.log(`*** Failed: VerifyAssetProperties, private information about asset ${assetKey} has not been verified by Fiserv`);
				}
			} catch (verifyError) {
				console.log(`${RED}*** Failed: VerifyAssetProperties - ${verifyError}${RESET}`);
			}

			try {
				// Agree to a buy by Fiserv
				const asset_price = {
					asset_id: assetKey,
					price: 100,
					trade_id: randomNumber.toString()
				};
				const asset_price_string = JSON.stringify(asset_price);
				console.log(`${GREEN}--> Submit Transaction: AgreeToBuy, ${assetKey} as Fiserv - endorsed by Fiserv${RESET}`);
				transaction = contractFiserv.createTransaction('AgreeToBuy');
				transaction.setEndorsingOrganizations(fiserv);
				transaction.setTransient({
					asset_price: Buffer.from(asset_price_string)
				});
				await transaction.submit(assetKey);
				console.log(`*** Result: committed, Fiserv has agreed to buy asset ${assetKey} for 100`);
			} catch (buyError) {
				console.log(`${RED}*** Failed: AgreeToBuy - ${buyError}${RESET}`);
			}

			// read the public details by both orgs
			await readAssetByBothOrgs(assetKey, apple, contractApple, contractFiserv);

			// Apple should be able to read the private data details of this asset
			await readPrivateAsset(assetKey, apple, contractApple);
			// Fiserv is not the owner and does not have the private details, this should fail
			await readPrivateAsset(assetKey, fiserv, contractFiserv);

			// Apple should be able to read the sale price of this asset
			await readSalePrice(assetKey, apple, contractApple);
			// Fiserv has not set a sale price and this should fail
			await readSalePrice(assetKey, fiserv, contractFiserv);

			// Apple has not agreed to buy so this should fail
			await readBidPrice(assetKey, apple, contractApple);
			// Fiserv should be able to see the price it has agreed
			await readBidPrice(assetKey, fiserv, contractFiserv);

			try {
				// Apple will try to transfer the asset to Fiserv
				// This will fail due to the sell price and the bid price
				// are not the same
				const asset_properties = {
					object_type: 'asset_properties',
					asset_id: assetKey,
					color: 'blue',
					size: 35,
					salt: Buffer.from(randomNumber.toString()).toString('hex')
				};
				const asset_properties_string = JSON.stringify(asset_properties);
				const asset_price = {
					asset_id: assetKey,
					price: 110,
					trade_id: randomNumber.toString()
				};
				const asset_price_string = JSON.stringify(asset_price);

				console.log(`${GREEN}--> Submit Transaction: TransferAsset, ${assetKey} as Apple - endorsed by Apple${RESET}`);
				console.log(`${asset_properties_string}`);
				transaction = contractApple.createTransaction('TransferAsset');
				transaction.setEndorsingOrganizations(apple);
				transaction.setTransient({
					asset_properties: Buffer.from(asset_properties_string),
					asset_price: Buffer.from(asset_price_string)
				});
				await transaction.submit(assetKey, fiserv);
				console.log(`${RED}*** Failed: committed, TransferAsset should have failed for asset ${assetKey}${RESET}`);
			} catch (transferError) {
				console.log(`*** Success: TransferAsset - ${transferError}`);
			}

			try {
				// Agree to a sell by Apple
				// Apple, the seller will agree to the bid price of Fiserv
				const asset_price = {
					asset_id: assetKey,
					price: 100,
					trade_id: randomNumber.toString()
				};
				const asset_price_string = JSON.stringify(asset_price);
				console.log(`${GREEN}--> Submit Transaction: AgreeToSell, ${assetKey} as Apple - endorsed by Apple${RESET}`);
				transaction = contractApple.createTransaction('AgreeToSell');
				transaction.setEndorsingOrganizations(apple);
				transaction.setTransient({
					asset_price: Buffer.from(asset_price_string)
				});
				await transaction.submit(assetKey);
				console.log(`*** Result: committed, Apple has agreed to sell asset ${assetKey} for 100`);
			} catch (sellError) {
				console.log(`${RED}*** Failed: AgreeToSell - ${sellError}${RESET}`);
			}

			// read the public details by both orgs
			await readAssetByBothOrgs(assetKey, apple, contractApple, contractFiserv);

			// Apple should be able to read the private data details of this asset
			await readPrivateAsset(assetKey, apple, contractApple);

			// Apple should be able to read the sale price of this asset
			await readSalePrice(assetKey, apple, contractApple);

			// Fiserv should be able to see the price it has agreed
			await readBidPrice(assetKey, fiserv, contractFiserv);

			try {
				// Fiserv user will try to transfer the asset to Fiserv
				// This will fail as the owner is Apple
				const asset_properties = {
					object_type: 'asset_properties',
					asset_id: assetKey,
					color: 'blue',
					size: 35,
					salt: Buffer.from(randomNumber.toString()).toString('hex')
				};
				const asset_properties_string = JSON.stringify(asset_properties);
				const asset_price = {
					asset_id: assetKey,
					price: 100,
					trade_id: randomNumber.toString()
				};
				const asset_price_string = JSON.stringify(asset_price);

				console.log(`${GREEN}--> Submit Transaction: TransferAsset, ${assetKey} as Fiserv - endorsed by Apple${RESET}`);
				console.log(`${asset_properties_string}`);
				transaction = contractFiserv.createTransaction('TransferAsset');
				transaction.setEndorsingOrganizations(apple, fiserv);
				transaction.setTransient({
					asset_properties: Buffer.from(asset_properties_string),
					asset_price: Buffer.from(asset_price_string)
				});
				await transaction.submit(assetKey, fiserv);
				console.log(`${RED}*** FAILED: committed, TransferAsset - Fiserv now owns the asset ${assetKey}${RESET}`);
			} catch (transferError) {
				console.log(`*** Succeded: TransferAsset - ${transferError}`);
			}

			try {
				// Apple will transfer the asset to Fiserv
				// This will now complete as the sell price and the bid price are the same
				const asset_properties = {
					object_type: 'asset_properties',
					asset_id: assetKey,
					color: 'blue',
					size: 35,
					salt: Buffer.from(randomNumber.toString()).toString('hex')
				};
				const asset_properties_string = JSON.stringify(asset_properties);
				const asset_price = {
					asset_id: assetKey,
					price: 100,
					trade_id: randomNumber.toString()
				};
				const asset_price_string = JSON.stringify(asset_price);

				console.log(`${GREEN}--> Submit Transaction: TransferAsset, ${assetKey} as Apple - endorsed by Apple${RESET}`);
				console.log(`${asset_properties_string}`);
				transaction = contractApple.createTransaction('TransferAsset');
				transaction.setEndorsingOrganizations(apple, fiserv);
				transaction.setTransient({
					asset_properties: Buffer.from(asset_properties_string),
					asset_price: Buffer.from(asset_price_string)
				});
				await transaction.submit(assetKey, fiserv);
				console.log(`*** Results: committed, TransferAsset - Fiserv now owns the asset ${assetKey}`);
			} catch (transferError) {
				console.log(`${RED}*** Failed: TransferAsset - ${transferError}${RESET}`);
			}

			// read the public details by both orgs
			await readAssetByBothOrgs(assetKey, fiserv, contractApple, contractFiserv);

			// Fiserv should be able to read the private data details of this asset
			await readPrivateAsset(assetKey, fiserv, contractFiserv);
			// Apple should not be able to read the private data details of this asset
			await readPrivateAsset(assetKey, apple, contractApple);

			try {
				// This is an update to the public state and requires only the owner to endorse.
				// Fiserv wants to indicate that the items is no longer for sale
				console.log(`${GREEN}--> Submit Transaction: ChangePublicDescription ${assetKey}, as Fiserv - endorse by Fiserv${RESET}`);
				transaction = contractFiserv.createTransaction('ChangePublicDescription');
				transaction.setEndorsingOrganizations(fiserv);
				await transaction.submit(assetKey, `Asset ${assetKey} owned by ${fiserv} is NOT for sale`);
				console.log('*** Results: committed - Fiserv is now the owner and asset is not for sale');
			} catch (updateError) {
				console.log(`${RED}*** Failed: ChangePublicDescription has failed by Fiserv - ${updateError}${RESET}`);
			}

			// read the public details by both orgs
			await readAssetByBothOrgs(assetKey, fiserv, contractApple, contractFiserv);
		} catch (runError) {
			console.error(`Error in transaction: ${runError}`);
			if (runError.stack) {
				console.error(runError.stack);
			}
			process.exit(1);
		} finally {
			// Disconnect from the gateway peer when all work for this client identity is complete
			console.log(`${GREEN}--> Close gateways`);
			gatewayApple.disconnect();
			gatewayFiserv.disconnect();
		}
	} catch (error) {
		console.error(`Error in setup: ${error}`);
		if (error.stack) {
			console.error(error.stack);
		}
		process.exit(1);
	}
	console.log(`${GREEN} **** END ****${RESET}`);
}
main();
