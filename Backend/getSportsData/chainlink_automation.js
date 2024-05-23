//Job to be run every day

////// Config //////
const ethers = require('ethers');
const axios = require('axios');
const fs = require("fs");
const path = require("path");
require('dotenv').config();

const {
    SubscriptionManager,
    simulateScript,
    SecretsManager,
    ResponseListener,
    ReturnType,
    createGist,
    deleteGist,
    decodeResult,
    FulfillmentCode,
  } = require("@chainlink/functions-toolkit");

const functionsConsumerAbi = require("../abi/token.json"); //ABI of the contract
require("@chainlink/env-enc").config();

const consumerAddress = "0xd2c8b79c75c9fab13533b95fd503758df928869a"; // REPLACE this with your Functions consumer address
const subscriptionId = 224; // REPLACE this with your subscription ID
const apiKey = process.env.API_KEY;

const makeRequestAmoy = async (teamID = "701",currentDate = "2024-05-18") => {
    // hardcoded for Polygon Amoy
    const routerAddress = "0xC22a79eBA640940ABB6dF0f7982cc119578E11De";
    const linkTokenAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
    const donId = "fun-polygon-amoy-1"; //bytes32: 0x66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000
    const explorerUrl = "https://www.oklink.com/amoy‍";
    const gistURL = "https://gist.github.com/stormerino78/509fc6d430bd9c2db94cdc62700315b5"; // gist url of the chainlink_function.js code 
    
    // Initialize functions settings
    const source = gistURL;
    const args = [teamID,currentDate];
    const secrets = { apiKey: process.env.API_KEY };
    const gasLimit = 300000;
    
    // Initialize ethers signer and provider to interact with the contracts onchain
    const privateKey = process.env.PRIVATE_KEY; // fetch PRIVATE_KEY
    if (!privateKey)
        throw new Error(
        "private key not provided - check your environment variables"
    );

    const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
    if (!rpcUrl)
       throw new Error(`rpcUrl not provided  - check your environment variables`);

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey);
    const signer = wallet.connect(provider); // create ethers signer for signing transactions


  ///////// START SIMULATION //////////// ✅
  console.log("Start simulation...");
  const response = await simulateScript({
    source: source,
    args: args,
    bytesArgs: [], // bytesArgs - arguments can be encoded off-chain to bytes.
    secrets: secrets,
  });
  console.log("Simulation result", response);
  const errorString = response.errorString;
  if (errorString) {
    console.log(`❌ Error during simulation: `, errorString);
  } else {
    const returnType = ReturnType.uint256;
    const responseBytesHexstring = response.responseBytesHexstring;
    if (ethers.utils.arrayify(responseBytesHexstring).length > 0) {
      const decodedResponse = decodeResult(
        response.responseBytesHexstring,
        returnType
      );
      console.log(`✅ Decoded response to ${returnType}: `, decodedResponse);
    }
  }

    //////// ESTIMATE REQUEST COSTS //////// ✅
    console.log("\nEstimate request costs...");
    // Initialize and return SubscriptionManager
    const subscriptionManager = new SubscriptionManager({
    signer: signer,
    linkTokenAddress: linkTokenAddress,
    functionsRouterAddress: routerAddress,
    });
    await subscriptionManager.initialize();

    // estimate costs in Juels

    const gasPriceWei = await signer.getGasPrice(); // get gasPrice in wei

    const estimatedCostInJuels =
    await subscriptionManager.estimateFunctionsRequestCost({
        donId: donId, // ID of the DON to which the Functions request will be sent
        subscriptionId: subscriptionId, // Subscription ID
        callbackGasLimit: gasLimit, // Total gas used by the consumer contract's callback
        gasPriceWei: BigInt(gasPriceWei), // Gas price in gWei
    });

    console.log(
    `Fulfillment cost estimated to ${ethers.utils.formatEther(
        estimatedCostInJuels
    )} LINK`
    );

    //////// MAKE REQUEST ////////

    console.log("\nMake request...");

    // First encrypt secrets and create a gist
    const secretsManager = new SecretsManager({
        signer: signer,
        functionsRouterAddress: routerAddress,
        donId: donId,
    });
    await secretsManager.initialize();

    // Encrypt secrets
    const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

    console.log(`Creating gist...`); //✅
    const githubApiToken = process.env.GITHUB_API_TOKEN;
    if (!githubApiToken)
        throw new Error(
        "githubApiToken not provided - check your environment variables"
    );

    // Create a new GitHub Gist to store the encrypted secrets
    const gistURLsecret = await createGist(
        githubApiToken,
        JSON.stringify(encryptedSecretsObj)
    );
    console.log(`\n✅Gist created ${gistURLsecret} . Encrypt the URLs..`);
    const encryptedSecretsUrls = await secretsManager.encryptSecretsUrls([
        gistURLsecret,
    ]);

    const functionsConsumer = new ethers.Contract(
    consumerAddress,
    functionsConsumerAbi,
    signer
    );

    console.log("gasLimit", gasLimit);
    // Actual transaction call
    console.log("source",source);
    console.log("encryptedSecretsUrls",encryptedSecretsUrls);
    console.log("args", args);
    console.log("subscriptionId", subscriptionId);
    console.log("gasLimit", gasLimit);
    console.log("donId", ethers.utils.formatBytes32String(donId));

    /*
    const transaction = await functionsConsumer.requestGameData(
        source, // source
        encryptedSecretsUrls, // user hosted secrets - encryptedSecretsUrls
        args,
        subscriptionId,
        gasLimit,
        ethers.utils.formatBytes32String(donId) // jobId is bytes32 representation of donId
    ); */

    // Log transaction details
    console.log(
    `\n✅ Functions request sent! Transaction hash ${transaction.hash}. Waiting for a response...`
    );

    console.log(
    `See your request in the explorer ${explorerUrl}/tx/${transaction.hash}`
    );

    const responseListener = new ResponseListener({
    provider: provider,
    functionsRouterAddress: routerAddress,
    }); // Instantiate a ResponseListener object to wait for fulfillment.
    (async () => {
    try {
        const response = await new Promise((resolve, reject) => {
        responseListener
            .listenForResponseFromTransaction(transaction.hash)
            .then((response) => {
            resolve(response); // Resolves once the request has been fulfilled.
            })
            .catch((error) => {
            reject(error); // Indicate that an error occurred while waiting for fulfillment.
            });
        });

        const fulfillmentCode = response.fulfillmentCode;

        if (fulfillmentCode === FulfillmentCode.FULFILLED) {
        console.log(
            `\n✅ Request ${
            response.requestId
            } successfully fulfilled. Cost is ${ethers.utils.formatEther(
            response.totalCostInJuels
            )} LINK.Complete reponse: `,
            response
        );
        } else if (fulfillmentCode === FulfillmentCode.USER_CALLBACK_ERROR) {
        console.log(
            `\n⚠️ Request ${
            response.requestId
            } fulfilled. However, the consumer contract callback failed. Cost is ${ethers.utils.formatEther(
            response.totalCostInJuels
            )} LINK.Complete reponse: `,
            response
        );
        } else {
        console.log(
            `\n❌ Request ${
            response.requestId
            } not fulfilled. Code: ${fulfillmentCode}. Cost is ${ethers.utils.formatEther(
            response.totalCostInJuels
            )} LINK.Complete reponse: `,
            response
        );
        }

        const errorString = response.errorString;
        if (errorString) {
        console.log(`\n❌ Error during the execution: `, errorString);
        } else {
            const responseBytesHexstring = response.responseBytesHexstring;
            if (ethers.utils.arrayify(responseBytesHexstring).length > 0) {
                const decodedResponse = decodeResult(
                response.responseBytesHexstring,
                ReturnType.uint256
                );
                console.log(
                `\n✅ Decoded response to ${ReturnType.uint256}: `,
                decodedResponse
                );
                // Delete gistURL - not needed anymore
                console.log(`Delete gistUrl ${gistURLsecret}`);
                await deleteGist(githubApiToken, gistURLsecret);
                console.log(`\n✅ Gist ${gistURLsecret} deleted`);
            }
        }
    } catch (error) {
        console.error("Error listening for response:", error);
    }
    })();
};

/*
makeRequestAmoy().catch((e) => {
    console.error(e);
    process.exit(1);
});
*/

/////// Automation CODE ////////

const TEAM_IDS = {
    'Chicago Fire FC': 694,
    'Colorado Rapids SC': 695,
    'Columbus Crew': 696,
    'D.C. United SC': 697,
    'FC Dallas': 698,
    'Houston Dynamo': 699,
    'Los Angeles Galaxy': 700,
    'CF Montréal': 701,
    'New England Revolution': 702
};

let scheduledActions = {}; // To keep track of scheduled actions

async function fetchMatchResults(teamID, date) { 
    //    team_IDs (dict): Sportmonk ID of the analysed team
    //    date (str): date of the analysed matches

    const getMatches  = await axios.get(`https://api.sportsdata.io/v4/soccer/scores/json/SchedulesBasic/mls/2024?key=${apiKey}`);
    const matchResults = getMatches.data.filter(match => {
        // Handle case where DateTime is null
        if (match.DateTime === null && match.Day.startsWith(date)) {
            console.log(`Match ${match.GameId} does not have a DateTime for now.`);
            return false; // or true, based on your requirement
        }
        else if (match.DateTime && match.Day.startsWith(date)) {
            return match.DateTime.startsWith(date);
        }
    });
    
    //console.log(JSON.stringify(matchResults, null ,2));

    // Filter match results for the specified team and ensure that the team ID comparison is correct by explicitly converting it to a decimal int
    const teamMatchResults = matchResults.filter(match => match.HomeTeamId === teamID  || match.AwayTeamId === teamID );
    //console.log("Filtered match results:", JSON.stringify(teamMatchResults, null, 2));
    return teamMatchResults;
}

async function scheduleMatchUpdates(teamID, date) {
    const matchResults = await fetchMatchResults(teamID, date); // Get all matches in the given date
    
    if (matchResults && matchResults.length > 0) {
        for (const match of matchResults) { // Get data for each match
            const matchId = match.GameId;
            const startTime = new Date(match.DateTime).getTime();
            const endTime = startTime + ((90 + 45) * 60 * 1000); // Assuming 90 + 45mins extra-time match time 
            const unblockingTime = endTime + (35 * 60 * 1000); // 35 minutes after the match ends (total of 2h10)
            
            // If the match has been rescheduled, clear existing actions
            if (scheduledActions[matchId]) {
                clearTimeout(scheduledActions[matchId].block);
                clearTimeout(scheduledActions[matchId].unblock);
                clearTimeout(scheduledActions[matchId].update);
            }

            // Storing the Schedule actions of locking/unlocking/updating
            scheduledActions[matchId] = {
                block: scheduleAction(startTime, async () => {
                    console.log(`Blocking trading for match ${matchId} at ${new Date(startTime)}`);
                    await contract.blockTrading();
                }),

                // Schedule unblocking trading
                unblock: scheduleAction(unblockingTime, async () => {
                    console.log(`Unblocking trading for match ${matchId} at ${new Date(unblockingTime)}`);
                    await contract.unblockTrading();
                }),

                // Schedule updating token prices
                update: scheduleAction(endTime, async () => {
                    console.log(`Updating token prices of ${teamID} for match ${matchId} at ${new Date(endTime)}`);
                    await makeRequestAmoy(teamID,currentDate); //make the function request
                })
            };
        }
    } else {
        console.log(`Failed to fetch match results for ${teamID}`);
    }
}

function scheduleAction(time, action) { // execute an action (lock,unlock,update) at a particular time in the future
    const now = Date.now();
    const delay = time - now; // get in how much time the action will process
    if (delay > 0) {
        setTimeout(action, delay);
    } else {
        // If the time has already passed, execute the action immediately
        action();
        return null;
    }
}

function getSportsData(){
    // Calculate startDate as today and endDate as 7 days from today
    const date = new Date();
    const currentDate = date.toISOString().split('T')[0]; // format as YYYY-MM-DD
    //const currentDate = '2024-05-18';
    console.log(currentDate);

    for (const teamID of Object.values(TEAM_IDS)) {
        scheduleMatchUpdates(teamID, currentDate);
    }
}

makeRequestAmoy().catch((e) => {
    console.error(e);
    process.exit(1);
  });