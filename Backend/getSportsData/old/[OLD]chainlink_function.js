if (!secrets.apiKey) {
    throw Error("API key required");
}
  
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
  
const startDate = '2024-05-07';
const endDate = '2024-05-15';

/*
Après avoir règler le problème de récupération des données via API en utilisant chainlink function, 
transformer le code pour récupérer les données seulement d'un match à partir d'un matchID.
Les dates/teams lists vont être dans le fichier chainlink_automation.js
de la même manière on va récupérer les infos match par match et update les token values match par match.
A la fin de chaque match, les token des deux équipes qui ont jouées vont être update l'un après l'autre.
*/
async function main() {
    const results = {}; // Initialize the matches results dictionary
  
    for (const [teamName, teamId] of Object.entries(TEAM_IDS)) {
      console.log(`Processing team: ${teamName} (ID: ${teamId})`);
      
      // Fetch match results
      try {
        const matchResultsRequest = Functions.makeHttpRequest({
          url: `https://api.sportmonks.com/v3/football/fixtures/between/${startDate}/${endDate}/${teamId}`,
          method: "GET",
          params: {
            start: startDate,
            end: endDate,
            team_id: teamId,
            api_token: secrets.apiKey 
          }
        });

        const matchResultsResponse = await matchResultsRequest;
        const matchResults = matchResultsResponse.data;

        if (matchResults && 'data' in matchResults) {
          for (const matchResult of matchResults.data) { // get data for each match
            const matchResultId = matchResult.id;
            // Determine winner and loser
            const teams = matchResult.name;
            const resultInfo = matchResult.result_info;
            let winner = null;
            let loser = null;
            let draw = false;
  
            if (teams.includes('vs')) {
              const [team1, team2] = teams.split(' vs ');
              if (!resultInfo) {
                console.log(`Match ${matchResult.id} result not yet received`);
              } else if (resultInfo.includes('won')) {
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
  
            if (!winner) continue;
  
            // Fetch odds
            try {
              const oddsRequest = Functions.makeHttpRequest({
                url: `https://api.sportmonks.com/v3/football/odds/pre-match/fixtures/`,
                method: "GET",
                params: { 
                  id: matchResultId,
                  api_token: secrets.apiKey 
                }
              });
              const oddsResponse = await oddsRequest;
              const oddsData = oddsResponse.data;
  
              // Filter relevant odds
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
                      relevantOdds.home_lose = bookmaker.value; // home lose is same as away win
                    } else if (label === 'draw') {
                      relevantOdds.draw = bookmaker.value;
                    }
                  }
                }
              }
  
              // Store match info
              const matchInfo = {
                matchResultId,
                winner,
                loser,
                draw,
                odds: relevantOdds
              };
  
              // Add the match info to the corresponding team's entry in the results object
              if (!results[teamName]) {
                results[teamName] = [];
              }
              results[teamName].push(matchInfo);
  
              if (draw) { // Console output of each match results
                console.log(`${teamName} Match Result: ${winner} ended in a draw against ${loser}, Odds: ${JSON.stringify(relevantOdds)}`);
              } else {
                if (winner === teamName) {
                  console.log(`${teamName} Match Result: ${winner} won against ${loser}, Odds: ${JSON.stringify(relevantOdds)}`);
                } else if (loser === teamName) {
                  console.log(`${teamName} Match Result: ${loser} lost against ${winner}, Odds: ${JSON.stringify(relevantOdds)}`);
                } else {
                  console.log(`Failed to fetch match results for ${teamName}`);
                }
              }
            } catch (error) {
              console.error(`Error fetching odds: ${error}`);
            }
          }
        } else {
          console.log(`Failed to fetch match results for ${teamName}`);
        }
      } catch (error) {
        console.error(`Error fetching match results: ${error}`);
      }
    }
    let formatedData = [];
    for (const [teamName, matches] of Object.entries(results)) { //iteration in the dict {"FC Copenhagen":[{"matchResultId":19104340,"winner":"FC Copenhagen","loser":"Brøndby","draw":false,"odds":{"home_win":"2.97","away_win":"2.15","draw":"3.45","home_lose":"2.15","away_lose":"2.97"}}]
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
    console.log(formatedData);
    return Functions.encodeString(JSON.stringify(formatedData));
  }

return main();