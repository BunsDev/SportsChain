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

const API_TOKEN = 'bFmPEsWn6EQXYkEyy1zfuTi3WhQWD2dKcoxeKyhhb5Ya1TqzCDQuSAbKSkkM';

const TEAM_IDS = {
    'FC Copenhagen': 85,
    'Midtjylland': 939,
    'Brøndby': 293,
    'AGF': 2905,
    'Randers': 2356,
    'Hvidovre': 8657,
    'Nordsjælland': 2394,
    'Vejle': 7466,
    'Lyngby': 2650
  };

let scheduledActions = {}; // To keep track of scheduled actions

async function fetchMatchResults(startDate, endDate, teamId) {
    /*
        start date (string): start date of the analysed macthes
        end_date (string): end date of the analysed macthes
        team_IDs (dict): Sportmonk ID of the analysed team
    */

    try {
        const response = await axios.get(`https://api.sportmonks.com/v3/football/fixtures/between/${startDate}/${endDate}/${teamId}`, { //sort by date 
        params: {
        start: startDate,
        end: endDate,
        team_id: teamId,
        api_token: API_TOKEN
        }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching match results: ${error}`);
    }
}

async function callChainlinkFunction(matchId) {
    try {
        const response = await axios.post('https://chainlink-function-url', {
            matchId: matchId
        });
        console.log(`Chainlink function called successfully for match ${matchId}`, response.data);
    } catch (error) {
        console.error(`Error calling Chainlink function for match ${matchId}: ${error}`);
    }
}

async function scheduleMatchUpdates(teamId, startDate, endDate) {
    const matchResults = await fetchMatchResults(startDate, endDate, teamId); // Get all matches in the given date
    
    if (matchResults && 'data' in matchResults) {
        for (const match of matchResults.data) { //get datas for each match
            const matchId = match.id;
            const startTime = new Date(match.starting_at).getTime();
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
                    console.log(`Updating token prices for match ${matchId} at ${new Date(endTime)}`);
                    await callChainlinkFunction(matchId);
                })
            };
        }
    } else {
        console.log(`Failed to fetch match results for ${teamName}`);
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
const currentDate = new Date();
const startDate = currentDate.toISOString().split('T')[0]; // format as YYYY-MM-DD
const endDateNotFormated = new Date(currentDate);
endDateNotFormated.setDate(endDateNotFormated.getDate() + 7); // add 7 days
const endDate = endDateNotFormated.toISOString().split('T')[0]; // format as YYYY-MM-DD
console.log(startDate, endDate);

for (const teamId of Object.values(TEAM_IDS)) {
    scheduleMatchUpdates(teamId, startDate, endDate);
}
