//Job to be run every day

////// Config //////
const ethers = require('ethers');
const axios = require('axios');
const fs = require("fs");
const path = require("path");
const cron = require('node-cron'); //scheduling actions
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

const functionsConsumerAbi = require("../abi/token.json");
require("@chainlink/env-enc").config();

const consumerAddress = "0x3d45A71c5B86eB3f175Fab1016537eb39f1Cd8b9";
const subscriptionId = 224;
const apiKey = process.env.API_KEY;

// Initialize ethers signer and provider to interact with the contracts onchain
const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const privateKey = process.env.PRIVATE_KEY; // fetch PRIVATE_KEY
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider); // create ethers signer for signing transactions

const makeRequestAmoy = async (teamID = "697", currentDate = "2024-05-18") => {
    // teamID (str): ID of the analysed team
    // currentDate (str): date of the analysed match

    // hardcoded for Polygon Amoy
    const routerAddress = "0xC22a79eBA640940ABB6dF0f7982cc119578E11De";
    const linkTokenAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
    const donId = "fun-polygon-amoy-1";
    const explorerUrl = "https://www.oklink.com/amoy‍";

    // Initialize functions settings
    const source = fs.readFileSync(path.resolve(__dirname, "chainlink_function.js")).toString();
    
    const args = [teamID,currentDate];
    const secrets = { apiKey: process.env.API_KEY };
    const gasLimit = 300000;
    
    if (!privateKey)
        throw new Error(
        "private key not provided - check your environment variables"
    );
    if (!rpcUrl)
       throw new Error(`rpcUrl not provided  - check your environment variables`);

    ///////// START SIMULATION //////////// ✅
    console.log("Start simulation...");
    console.log(args);
    const response = await simulateScript({
        source: source,
        args: args,
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
    
    //////// ESTIMATE REQUEST COSTS //////// 
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
            donId: donId, 
            subscriptionId: subscriptionId,
            callbackGasLimit: gasLimit, 
            gasPriceWei: BigInt(gasPriceWei),
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
    const gistURL = await createGist(
        githubApiToken,
        JSON.stringify(encryptedSecretsObj)
    );
    console.log(`\n✅Gist created ${gistURL} . Encrypt the URLs..`);
    const encryptedSecretsUrls = await secretsManager.encryptSecretsUrls([
        gistURL,
    ]);
    const functionsConsumer = new ethers.Contract(
        consumerAddress,
        functionsConsumerAbi,
        signer
    );
    console.log("gasLimit", gasLimit);

    // Actual transaction call
    //console.log("source",source);
    console.log("encryptedSecretsUrls",encryptedSecretsUrls);
    //console.log("args", args);
    //console.log("subscriptionId", subscriptionId);
    //console.log("gasLimit", gasLimit);
    //console.log("donId", ethers.utils.formatBytes32String(donId));

    const transaction = await functionsConsumer.requestGameData(
        source, // source code of the chainlink function
        encryptedSecretsUrls, // user hosted secrets - encryptedSecretsUrls
        args,
        subscriptionId,
        gasLimit,
        ethers.utils.formatBytes32String(donId) // jobId is bytes32 representation of donId
    );

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
                )} LINK. Complete response: `,
                response
            );

            // Process and update the price
            const updatePrice = await functionsConsumer.processAndUpdatePrice(teamID);
            console.log(
                `\n✅ processAndUpdatePrice called! Transaction hash ${updatePrice.hash}. Waiting for confirmation...`
            );
            const receipt = await updatePrice.wait();
            console.log(
                `Transaction confirmed: ${receipt.confirmations}`
            );
            console.log(
                `Updated price for teamID ${teamID} is ${await functionsConsumer.getTokenPrice(teamID)}`
            );
        } else if (fulfillmentCode === FulfillmentCode.USER_CALLBACK_ERROR) {
            console.log(
                `\n⚠️ Request ${
                    response.requestId
                } fulfilled. However, the consumer contract callback failed. Cost is ${ethers.utils.formatEther(
                    response.totalCostInJuels
                )} LINK. Complete response: `,
                response
            );
        } else {
            console.log(
                `\n❌ Request ${
                    response.requestId
                } not fulfilled. Code: ${fulfillmentCode}. Cost is ${ethers.utils.formatEther(
                    response.totalCostInJuels
                )} LINK. Complete response: `,
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
                    ReturnType.string
                );
                console.log(
                    `\n✅ Decoded response to ${ReturnType.string}: `,
                    decodedResponse
                );
                // Delete gistURL - not needed anymore
                console.log(`Delete gistUrl ${gistURL}`);
                await deleteGist(githubApiToken, gistURL);
                console.log(`\n✅ Gist ${gistURL} deleted`);
            }
        }
    } catch (error) {
        console.error("Error listening for response:", error);
    }
};


makeRequestAmoy().catch((e) => {
    console.error(e);
    process.exit(1);
});


/////// Automation CODE ////////

//Initial price: 1000000 wei

const TEAM_IDS = {
    'Chicago Fire FC': 694, //CHI token address : 0xAf8aFdE09d1Ab9a7b5F4B1378C07725481d028fe
    'Colorado Rapids SC': 695, //COL token address : 0x84348cE503b80C1B1B1CF310932731307663c78f
    'Columbus Crew': 696, //CLB token address : 0x9F0C3f7Ee61d1c76909f58C8e53c7F9943c1d897
    'D.C. United SC': 697, //DCU token address : 0x9f30159ff2c449bb7400F4eD6601555D92121e56
    'FC Dallas': 698, //DAL token address : 0xe8B6CABd282Ffecd0b0aC22153E0c2413498406e
    'Houston Dynamo': 699, //HOU token address : 0xF2b4056b1cF5b6C3ad8777A9546f219bb8A27d1E
    'Los Angeles Galaxy': 700, //LAG token address : 0x71f9B41059144C77BDF43013168bdD7E0ca69B4c
    'CF Montréal': 701, // MIM token address : 0x4D0bebfAD65739326FD13CF86d5E6E8240fD88f4
    'New England Revolution': 702 //NER token address : 0xC87Cf64A56cb3dbF10B8d8293857718EBe543C34
};

let actionQueue = []; // Queue to store actions
let isProcessing = false; // Flag to indicate if the queue is being processed
let scheduledActions = {};

async function fetchmatchData(teamID, date) { 
    //    team_IDs (dict): ID of the analysed teams
    //    date (str): date of the analysed matches
    const getMatches  = await axios.get(`https://api.sportsdata.io/v4/soccer/scores/json/SchedulesBasic/mls/2024?key=${apiKey}`);
    const matchData = getMatches.data.filter(match => {
        // Handle case where DateTime is null
        if (match.DateTime === null && match.Day.startsWith(date)) {
            console.log(`Match ${match.GameId} does not have a DateTime for now.`);
            return false; // or true, based on your requirement
        }
        else if (match.DateTime && match.Day.startsWith(date)) {
            return match.DateTime.startsWith(date);
        }
    });
    
    //console.log(JSON.stringify(matchData, null ,2));

    // Filter match results for the specified team and ensure that the team ID comparison is correct by explicitly converting it to a decimal int
    const teammatchData = matchData.filter(match => match.HomeTeamId === teamID  || match.AwayTeamId === teamID );
    //console.log("Filtered match results:", JSON.stringify(teammatchData, null, 2));
    return teammatchData;
}

async function scheduleMatchUpdates(teamID, date) {
    //    team_IDs (dict): ID of the analysed teams
    //    date (str): date of the analysed matches
    const matchData = await fetchmatchData(teamID, date); // Get all matches in the given date
    const contract = new ethers.Contract(
        consumerAddress,
        functionsConsumerAbi,
        signer
    );
    
    if (matchData && matchData.length > 0) {
        for (const match of matchData) { // Get data for each match
            const matchId = match.GameId;
            const startTime = new Date(match.DateTime).getTime(); //UTC format
            const endTime = startTime + ((90 + 45) * 60 * 1000); // Assuming 90 + 45mins extra-time match time 
            const unblockingTime = endTime + (35 * 60 * 1000); // 35 minutes after the match ends (total of 2h10)
            console.log(`The team ${teamID} plays at ${new Date(startTime)}`);
            // If the match has been rescheduled, clear existing actions
            if (scheduledActions[matchId]) {
                clearTimeout(scheduledActions[matchId].block);
                clearTimeout(scheduledActions[matchId].unblock);
                clearTimeout(scheduledActions[matchId].update);
            }

            scheduledActions[matchId] = {};

            // Storing the Schedule actions of locking/unlocking/updating
            scheduledActions[matchId].block = scheduleAction(startTime, async () => {
                console.log(`Blocking trading for match ${matchId} at ${new Date(startTime)}`);
                await contract.blockTrading();
                processNextAction();
            });

            scheduledActions[matchId].unblock = scheduleAction(unblockingTime, async () => {
                console.log(`Unblocking trading for match ${matchId} at ${new Date(unblockingTime)}`);
                await contract.unblockTrading();
                processNextAction();
            });

            scheduledActions[matchId].update = scheduleAction(endTime, async () => {
                console.log(`Updating token prices of ${teamID} for match ${matchId} at ${new Date(endTime)}`);
                await makeRequestAmoy(String(teamID), date);
                processNextAction();
            });
        }
    } else {
        console.log(`The team ${teamID} doesn't play on the ${date}`);
    }
}

function scheduleAction(time, action) {
    actionQueue.push({ time, action });
    processNextAction();
}

function processNextAction() {
    if (isProcessing || actionQueue.length === 0) {
        return;
    }
    const nextAction = actionQueue.shift();
    const now = Date.now();
    const delay = nextAction.time - now;
    isProcessing = true;
    if (delay > 0) {
        setTimeout(async () => {
            await nextAction.action();
            isProcessing = false;
            processNextAction();
        }, delay);
    } else {
        (async () => {
            await nextAction.action();
            isProcessing = false;
            processNextAction();
        })();
    }
}

function getSportsData(){
    // Calculate startDate as today and endDate as 7 days from today
    const date = new Date();
    //const currentDate = date.toISOString().split('T')[0]; // format as YYYY-MM-DD UTC
    const currentDate = '2024-05-19';
    console.log(currentDate);

    for (const teamID of Object.values(TEAM_IDS)) {
        scheduleMatchUpdates(teamID, currentDate);
    }
}

/*
// Schedule the getSportsData function to run every day at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Getting matches schedule at midnight');
    getSportsData();
});
console.log('Scheduled job set to run every day at midnight');
*/
//getSportsData()
