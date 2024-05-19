const axios = require('axios');

const API_TOKEN = 'bFmPEsWn6EQXYkEyy1zfuTi3WhQWD2dKcoxeKyhhb5Ya1TqzCDQuSAbKSkkM';

const LEAGUE_ID = 271;  // Danish Superliga ID
const SEASON_ID = 21644;  // Current season ID
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

const start_date = '2024-05-07';
const end_date = '2024-05-15';

async function fetchMatchResults(startDate, endDate, teamId) {
  /*
    start date (string): start date of the analysed macthes
    end_date (string): end date of the analysed macthes
    team_IDs (dict): Sportmonk ID of the analysed team
  */

  try {
    const response = await axios.get(`https://api.sportmonks.com/v3/football/fixtures/between/${startDate}/${endDate}/${teamId}`, { //sort by date 
      params: { api_token: API_TOKEN, sort: 'starting_at', order: 'desc' }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching match results: ${error}`);
  }
}

async function fetchOdds(fixtureId) {
  /*
  fixture_id (string): Sportmonk ID of the analysed match
  */

  try {
    const response = await axios.get(`https://api.sportmonks.com/v3/football/odds/pre-match/fixtures/${fixtureId}`, {
      params: { api_token: API_TOKEN }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching odds: ${error}`);
  }
}

async function fetchPlayerStatistics(teamId) {
  /*
  team_id (string): Sportmonk ID of the analysed team
  */

  try {
    const response = await axios.get(`https://api.sportmonks.com/v3/football/players/team/${teamId}`, {
      params: { api_token: API_TOKEN, include: 'stats' }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching player statistics: ${error}`);
  }
}

function getWinnerLoser(match) {
  /*
  match (dict): All datas corresponding to the analysed match through the fixture API request
  */

  const teams = match.name;
  const resultInfo = match.result_info;

  let winner = null;
  let loser = null;
  let draw = false;

  if (teams.includes('vs')) {
    const [team1, team2] = teams.split(' vs '); //"Team 1 vs Team 2"
    if (!resultInfo) {
      console.log(`Match ${match.id} result not yet received`);
    } else if (resultInfo.includes('won')) { //"Team 1 won against Team 2"
      winner = resultInfo.split(' won')[0].trim();
      loser = winner === team1 ? team2 : team1;
    } else if (resultInfo.includes('draw')) {
      winner = team1;
      loser = team2;
      draw = true;
    } else {
      console.log('Error: Match result format not recognized');
    }
  } else {
    console.log('Error: Match name format not recognized');
  }

  return { winner, loser, draw };
}

function filterOdds(oddsData) {
  /*
  odds_data (dict): All pre-match odds data for the analysed match through the pre-match odds API request
  */

  const relevantOdds = {
    home_win: null,
    draw: null,
    home_lose: null,
  };

  if ('data' in oddsData) {
    for (const bookmaker of oddsData.data) {
      const marketDescription = bookmaker.market_description.toLowerCase();
      const label = bookmaker.label.toLowerCase();

      if (marketDescription.includes('match winner')) {
        if (label === 'home') {
          relevantOdds.home_win = bookmaker.value;
        } else if (label === 'away') {
          relevantOdds.home_lose = bookmaker.value;  // home lose is same as away win
        } else if (label === 'draw') {
          relevantOdds.draw = bookmaker.value;
        }
      }
    }
  }

  return relevantOdds;
}

function formatData(matchResults){
  let formatedData = [];
  for (const [teamName, matches] of Object.entries(matchResults)) { //iteration in the dict {"FC Copenhagen":[{"matchResultId":19104340,"winner":"FC Copenhagen","loser":"Brøndby","draw":false,"odds":{"home_win":"2.97","away_win":"2.15","draw":"3.45","home_lose":"2.15","away_lose":"2.97"}}]
    for (const match of matches) { //if multiple matches per teams
        let formatedResult;
        if (match.draw === true) { //check the draw boolean
          formatedResult = 0;
            odds = match.odds.draw
        }
        else{
            if (match.winner === teamName) { // check winning team
              formatedResult = 1; // The team is the winner
                odds = match.odds.home_win
            } else {
              formatedResult = 2; // The team is the loser
                odds = match.odds.home_lose
            }
        }
        formatedData.push([teamName, formatedResult, odds]);
      }
  }
  return formatedData;
}
async function resultSummary(startDate, endDate, teamIDs = TEAM_IDS) {
  /*
  startDate (string): start date of the analysed macthes
    endDate (string): end date of the analysed macthes
    teamIDs (dict): Table of analysed team matches and their corresponding Sportmonk IDs
  */

  const results = {}; //Initialise the matches results dictionnary

  for (const [teamName, teamId] of Object.entries(teamIDs)) {
    console.log(`Processing team: ${teamName} (ID: ${teamId})`);
    const matchResults = await fetchMatchResults(startDate, endDate, teamId); // Get all matches in the given date

    if (matchResults && 'data' in matchResults) {
      for (const matchResult of matchResults.data) { //get datas for each match
        const matchResultId = matchResult.id;
        const { winner, loser, draw } = getWinnerLoser(matchResult);
        if (!winner) continue;

        const oddsData = await fetchOdds(matchResultId);
        const matchOdds = filterOdds(oddsData);

        const matchInfo = {
          matchResultId,
          winner,
          loser,
          draw,
          odds: matchOdds
        }; // Saving result of each match as a dictionnary

        // Add the match info to the corresponding team's entry in the results object
        if (!results[teamName]) {
          results[teamName] = [];
        }
        results[teamName].push(matchInfo);

        if (draw) { //Console output of each match results
          console.log(`${teamName} Match Result: ${winner} ended in a draw against ${loser}, Odds: ${JSON.stringify(matchOdds)}`);
        } else {
          if (winner === teamName) {
            console.log(`${teamName} Match Result: ${winner} won against ${loser}, Odds: ${JSON.stringify(matchOdds)}`);
          } else if (loser === teamName) {
            console.log(`${teamName} Match Result: ${loser} lost against ${winner}, Odds: ${JSON.stringify(matchOdds)}`);
          } else {
            console.log(`Failed to fetch match results for ${teamName}`);
          }
        }
      }
    } else {
      console.log(`Failed to fetch match results for ${teamName}`);
    }
  }

  const formatedData = formatData(results);
  // Send the results to the API
  try {
    const response = await axios.post('http://localhost:3000/api/match-results', formatedData);
    console.log('Data sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

resultSummary(start_date, end_date);

/*
// Fetch player statistics
for (const [teamName, teamId] of Object.entries(TEAM_IDS)) {
  const players = await fetchPlayerStatistics(teamId);

  if (players && 'data' in players) {
    for (const player of players.data) {
      const playerId = player.id;
      const playerStatsResponse = await axios.get(`https://api.sportmonks.com/v3/football/players/${playerId}`, {
        params: { api_token: API_TOKEN, include: 'stats' }
      });
      const playerStats = playerStatsResponse.data;
      console.log(`${teamName} Player Stats: ${JSON.stringify(playerStats)}`);
    }
  } else {
    console.log(`Failed to fetch player statistics for ${teamName}`);
  }
}
*/
