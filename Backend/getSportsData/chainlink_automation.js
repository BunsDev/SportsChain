//Job to be run every day

const ethers = require('ethers');
const axios = require('axios');

/*
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS';
const CONTRACT_ABI = require('./SportsToken.json').abi;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
*/

const apiKey = 'cb593afb54874c6bb19321e6d22b0708';

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
    /*
        team_IDs (dict): Sportmonk ID of the analysed team
        date (str): date of the analysed matches
    */
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

async function callChainlinkFunction(teamID, currentDate) {
    try {
        const response = await axios.post('https://chainlink-function-url', {
            teamid: teamID,
            date: currentDate
        });
        console.log(`Price successfully updated through chainlink function for the team ${teamID}`, response.data);
    } catch (error) {
        console.error(`Error calling Chainlink function to update the price token of the team ${teamID}: ${error}`);
    }
}

async function scheduleMatchUpdates(teamID, date) {
    const matchResults = await fetchMatchResults(teamID, date); // Get all matches in the given date
    
    if (matchResults && matchResults.length > 0) {
        for (const match of matchResults) { // Get data for each match
            const matchId = match.GameId;
            const startTime = new Date(match.DateTime).getTime();
            const endTime = startTime + ((90 + 35) * 60 * 1000); // Assuming 90 + 35mins extra-time match time 
            const unblockingTime = endTime + (35 * 60 * 1000); // 35 minutes after the match ends (total of 2h)
            
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
                    //await contract.blockTrading();
                }),

                // Schedule unblocking trading
                unblock: scheduleAction(unblockingTime, async () => {
                    console.log(`Unblocking trading for match ${matchId} at ${new Date(unblockingTime)}`);
                    //await contract.unblockTrading();
                }),

                // Schedule updating token prices
                update: scheduleAction(endTime, async () => {
                    console.log(`Updating token prices of ${teamID} for match ${matchId} at ${new Date(endTime)}`);
                    await callChainlinkFunction(teamID, date);
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

// Calculate startDate as today and endDate as 7 days from today
const date = new Date();
//const currentDate = date.toISOString().split('T')[0]; // format as YYYY-MM-DD
const currentDate = '2024-05-18';
console.log(currentDate);

for (const teamID of Object.values(TEAM_IDS)) {
    scheduleMatchUpdates(teamID, currentDate);
}
