// Chainlink function

const apiKey = secrets.apiKey
if (!apiKey) {
    throw Error("API key required");
}

//Get the team ID
const teamID = parseInt(args[0], 10); // Ensure the team ID is an integer
//Get date
const date = args[1];
// Initialize the matches results dictionary
const results = {};

// Fetch match results for a given date
const getMatches  = await Functions.makeHttpRequest({url: `https://api.sportsdata.io/v4/soccer/scores/json/SchedulesBasic/mls/2024?key=${apiKey}`});
const matchResults = getMatches.data.filter(match => match.Day.startsWith(date));
//console.log(JSON.stringify(matchResults, null ,2));
if (getMatches.error) {
    console.log(getMatches.error);
    throw Error("Request Matches datas failed");
}

//console.log("Match Results IDs:", JSON.stringify(matchResults.map(match => ({ HomeTeamId: match.HomeTeamId, AwayTeamId: match.AwayTeamId })), null, 2));

// Filter match results for the specified team
// Ensure that the team ID comparison is correct by explicitly converting it to a decimal int
const teamMatchResults = matchResults.filter(
    match => match.HomeTeamId === teamID  || match.AwayTeamId === teamID 
);

//console.log("Filtered match results:", JSON.stringify(teamMatchResults, null, 2));

// Check matches from the filtered results
if (teamMatchResults.length === 0) {
    throw Error(`No match results found for team ID: ${teamID}`);
}

//Fetch odds for matches on a given date
const getOdds = await Functions.makeHttpRequest({url:`https://api.sportsdata.io/v4/soccer/odds/json/GameOddsByDate/MLS/${date}?key=${apiKey}`});
const oddsData = getOdds.data;
//console.log(JSON.stringify(oddsData, null ,2));
if (getOdds.error) {
    console.log(getOdds.error);
    throw Error("Request Odds datas failed");
}

let teamName = null;
//Determine the winner, loser, and if the match was a draw
for (const matchResult of teamMatchResults) { //if there is several matches in a day (not likely to happen)
    const homeTeam = matchResult.HomeTeamName;
    const awayTeam = matchResult.AwayTeamName;
    const homeScore = matchResult.HomeTeamScore;
    const awayScore = matchResult.AwayTeamScore;
    const homePenaltyScore = matchResult.HomeTeamScorePenalty;
    const awayPenaltyScore = matchResult.AwayTeamScorePenalty;
    if (teamID === matchResult.HomeTeamId){
        teamName = matchResult.HomeTeamName
    } else if (teamID === matchResult.AwayTeamId){
        teamName = matchResult.AwayTeamName
    }


    let winner = null;
    let loser = null;
    let draw = false;

    if (homeScore !== null && awayScore !== null) { //Check if the result of the match is available
        if (homePenaltyScore == null && awayPenaltyScore == null){ //check if the match ended with penalties
            if (homeScore > awayScore) {
            winner = homeTeam;
            loser = awayTeam;
            } else if (homeScore < awayScore) {
            winner = awayTeam;
            loser = homeTeam;
            } else {
            winner = homeTeam;
            loser = awayTeam;
            draw = true;
            }
        }else{
            if (homePenaltyScore > awayPenaltyScore) {
                winner = homeTeam;
                loser = awayTeam;
                } else if (homePenaltyScore < awayPenaltyScore) {
                winner = awayTeam;
                loser = homeTeam;
            }
        }
    } else {
        console.log(`Match ${matchResult.GameId} result not yet received`);
    }

    if (!winner) continue;

    //Filter and format the odds data for a specific match.
    const matchOdds = {
        home_win: null,
        draw: null,
        home_lose: null,
    };

    const gameOdds = oddsData.find(odds => odds.GameId === matchResult.GameId);

    if (gameOdds && gameOdds.PregameOdds && gameOdds.PregameOdds.length > 0) {
        const marketOdds = gameOdds.PregameOdds[0];

        // Convert American odds to Decimal (French) odds directly
        if (marketOdds.HomeMoneyLine > 0) {
            matchOdds.home_win = (1 + (marketOdds.HomeMoneyLine / 100)).toFixed(2);
        } else {
            matchOdds.home_win = (1 + (100 / Math.abs(marketOdds.HomeMoneyLine))).toFixed(2);
        }

        if (marketOdds.DrawMoneyLine > 0) {
            matchOdds.draw = (1 + (marketOdds.DrawMoneyLine / 100)).toFixed(2);
        } else {
            matchOdds.draw = (1 + (100 / Math.abs(marketOdds.DrawMoneyLine))).toFixed(2);
        }

        if (marketOdds.AwayMoneyLine > 0) {
            matchOdds.home_lose = (1 + (marketOdds.AwayMoneyLine / 100)).toFixed(2);
        } else {
            matchOdds.home_lose = (1 + (100 / Math.abs(marketOdds.AwayMoneyLine))).toFixed(2);
        }
    }

    //save the matches results
    const matchInfo = {
        matchResultId: matchResult.GameId,
        winner,
        loser,
        draw,
        odds: matchOdds,
        HomeTeamId: matchResult.HomeTeamId,
        AwayTeamId: matchResult.AwayTeamId,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
    };

        results[teamID] = results[teamID] || [];
        results[teamID].push(matchInfo);
}
// Format the match results into an adequate structure to be sent to the smart contract
let formattedData = [];
const teamMatches = results[teamID] || [];
console.log(JSON.stringify(teamMatches, null, 2));
for (const match of teamMatches) {
    let formattedResult;
    let odds;
    if (match.draw === true) {
        formattedResult = 0;
        odds = match.odds.draw;
    } else {
        if (teamID === match.HomeTeamId) {
            if (match.winner === match.homeTeam) {
                formattedResult = 1; // The team is the winner
                odds = match.odds.home_win;
            } else {
                formattedResult = 2; // The team is the loser
                odds = match.odds.home_lose;
            }
        } else if (teamID === match.AwayTeamId) {
            if (match.winner === match.awayTeam) {
                formattedResult = 1; // The team is the winner
                odds = match.odds.home_lose; // odds for away team win
            } else {
                formattedResult = 2; // The team is the loser
                odds = match.odds.home_win; // odds for away team lose
            }
        }
        odds = parseFloat(odds) //convert into decimal number for calculation within the smart-contract
        odds = odds * 100 //make it a int
        // Log the results into the console in a comprehensive way
        if (match.draw) {
            console.log(`${match.homeTeam} vs ${match.awayTeam} Match Result: ${match.winner} ended in a draw against ${match.loser}, Odds: ${odds}`);
        } else {
            if (match.winner === teamName) {
                console.log(`${teamName} Match Result: ${match.winner} won against ${match.loser}, Odds: ${odds}`);
            } else if (match.loser === teamName) {
                console.log(`${teamName} Match Result: ${match.loser} lost against ${match.winner}, Odds: ${odds}`);
            }
        }
    }
    formattedData.push(teamID, formattedResult, odds);
}

console.log(formattedData);
return Functions.encodeString(JSON.stringify(formattedData));