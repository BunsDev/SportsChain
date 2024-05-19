/*
Chainlink function that operates with match ID
*/

if (!secrets.apiKey) {
    throw Error("API key required");
}

//const API_TOKEN = 'bFmPEsWn6EQXYkEyy1zfuTi3WhQWD2dKcoxeKyhhb5Ya1TqzCDQuSAbKSkkM';

const matchId = args[0]; // matchId is passed as the first argument to the function

async function main() {
    const results = {}; // Initialize the matches results dictionary

    // Fetch match results
    try {
        const matchResultsRequest = Functions.makeHttpRequest({
            url: `https://api.sportmonks.com/v3/football/fixtures/${matchId}`,
            method: "GET",
            params: {
                api_token: secrets.apiKey 
            }
        });

        const matchResultsResponse = await matchResultsRequest;
        const matchResult = matchResultsResponse.data.data; // Single match data

        if (matchResult) {
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

            if (!winner) return;

            // Fetch odds
            try {
                const oddsRequest = Functions.makeHttpRequest({
                    url: `https://api.sportmonks.com/v3/football/odds/pre-match/fixtures/${matchId}`,
                    method: "GET",
                    params: { 
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
                    matchResultId: matchResult.id,
                    winner,
                    loser,
                    draw,
                    odds: relevantOdds
                };

                const teamName1 = matchResult.localTeam.data.name;
                const teamName2 = matchResult.visitorTeam.data.name;

                results[teamName1] = results[teamName1] || [];
                results[teamName1].push(matchInfo);

                results[teamName2] = results[teamName2] || [];
                results[teamName2].push(matchInfo);

                if (draw) { // Console output of each match results
                    console.log(`${teamName1} vs ${teamName2} Match Result: ${winner} ended in a draw against ${loser}, Odds: ${JSON.stringify(relevantOdds)}`);
                } else {
                    if (winner === teamName1) {
                        console.log(`${teamName1} Match Result: ${winner} won against ${loser}, Odds: ${JSON.stringify(relevantOdds)}`);
                    } else if (loser === teamName1) {
                        console.log(`${teamName1} Match Result: ${loser} lost against ${winner}, Odds: ${JSON.stringify(relevantOdds)}`);
                    }
                    if (winner === teamName2) {
                        console.log(`${teamName2} Match Result: ${winner} won against ${loser}, Odds: ${JSON.stringify(relevantOdds)}`);
                    } else if (loser === teamName2) {
                        console.log(`${teamName2} Match Result: ${loser} lost against ${winner}, Odds: ${JSON.stringify(relevantOdds)}`);
                    } else {
                        console.log(`Failed to fetch match results for ${teamName1} or ${teamName2}`);
                    }
                }
            } catch (error) {
                console.error(`Error fetching odds: ${error}`);
            }
        } else {
            console.log(`Failed to fetch match results for matchId ${matchId}`);
        }
    } catch (error) {
        console.error(`Error fetching match results: ${error}`);
    }

    let formatedData = [];
    for (const [teamName, matches] of Object.entries(results)) { // iteration in the dict {"FC Copenhagen":[{"matchResultId":19104340,"winner":"FC Copenhagen","loser":"Brøndby","draw":false,"odds":{"home_win":"2.97","away_win":"2.15","draw":"3.45","home_lose":"2.15","away_lose":"2.97"}}]
        for (const match of matches) { // if multiple matches per teams
            let formatedResult;
            let odds;
            if (match.draw === true) { // check the draw boolean
                formatedResult = 0;
                odds = match.odds.draw;
            } else {
                if (match.winner === teamName) { // check winning team
                    formatedResult = 1; // The team is the winner
                    odds = match.odds.home_win;
                } else {
                    formatedResult = 2; // The team is the loser
                    odds = match.odds.home_lose;
                }
            }
            formatedData.push([teamName, formatedResult, odds]);
        }
    }
    console.log(formatedData);
    return Functions.encodeString(JSON.stringify(formatedData));
}

return main();
