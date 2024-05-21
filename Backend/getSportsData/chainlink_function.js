/*
Chainlink function that operates with match ID
*/

const apiKey = secrets.API_KEY
if (!apiKey) {
    throw Error("API key required");
}

//Get the team ID
const teamID = parseInt(args[0], 10); // Ensure the team ID is an integer

/*
const TEAM_IDS = {
    'Chicago Fire FC': '694',
    'Colorado Rapids SC': '695',
    'Columbus Crew': '696',
    'D.C. United SC': '697',
    'FC Dallas': '698',
    'Houston Dynamo': '699',
    'Los Angeles Galaxy': '700',
    'CF Montréal': '701',
    'New England Revolution': '702'
  };
*/

const date = '2024-05-18';

const results = {}; // Initialize the matches results dictionary

// Fetch match results for a given date
const getMatches  = await Functions.makeHttpRequest({url: `https://api.sportsdata.io/v4/soccer/scores/json/SchedulesBasic/mls/2024?key=${apiKey}`});
const matchResults = getMatches.data.filter(match => match.Day.startsWith(date));
//console.log(JSON.stringify(matchResults, null ,2));
if (getMatches.error) {
    console.log(getMatches.error);
    throw Error("Request Matches datas failed");
}

//Fetch odds for matches on a given date
const getOdds = await Functions.makeHttpRequest({url:`https://api.sportsdata.io/v4/soccer/odds/json/GameOddsByDate/MLS/${date}?key=${apiKey}`});
const oddsData = getOdds.data;
//console.log(JSON.stringify(oddsData, null ,2));
if (getOdds.error) {
    console.log(getOdds.error);
    throw Error("Request Odds datas failed");
}

console.log("Team ID:", teamID);
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


//Determine the winner, loser, and if the match was a draw
for (const matchResult of teamMatchResults) { //if there is several matches in a day (not likely to happen)
    const homeTeam = matchResult.HomeTeamName;
    const awayTeam = matchResult.AwayTeamName;
    const homeScore = matchResult.HomeTeamScore;
    const awayScore = matchResult.AwayTeamScore;
    const homePenaltyScore = matchResult.HomeTeamScorePenalty;
    const awayPenaltyScore = matchResult.AwayTeamScorePenalty;


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
    console.log(JSON.stringify(gameOdds, null, 2));
    if (gameOdds && gameOdds.PregameOdds && gameOdds.PregameOdds.length > 0) {
        const marketOdds = gameOdds.PregameOdds[0];

        // get the odds with a % form (decimal)
        matchOdds.home_win = marketOdds.HomeMoneyLine/100;
        matchOdds.draw = marketOdds.DrawMoneyLine/100;
        matchOdds.home_lose = marketOdds.AwayMoneyLine/100;
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

    // Log the results into the console in a comprehensive way
    if (draw) {
        console.log(`${homeTeam} vs ${awayTeam} Match Result: ${winner} ended in a draw against ${loser}, Odds: ${JSON.stringify(matchOdds)}`);
    } else {
        if (winner === homeTeam) {
            console.log(`${homeTeam} Match Result: ${winner} won against ${loser}, Odds: ${JSON.stringify(matchOdds)}`);
        } else if (loser === homeTeam) {
            console.log(`${homeTeam} Match Result: ${loser} lost against ${winner}, Odds: ${JSON.stringify(matchOdds)}`);
        }
        if (winner === awayTeam) {
            console.log(`${awayTeam} Match Result: ${winner} won against ${loser}, Odds: ${JSON.stringify(matchOdds)}`);
        } else if (loser === awayTeam) {
            console.log(`${awayTeam} Match Result: ${loser} lost against ${winner}, Odds: ${JSON.stringify(matchOdds)}`);
        } else {
            console.log(`Failed to fetch match results for ${homeTeam} or ${awayTeam}`);
        }
    }
}

// Format the match results into an adequate structure to be sent to the smart contract
let formattedData = [];
const teamMatches = results[teamID] || [];
for (const match of teamMatches) {
    let formattedResult;
    let odds;
    if (match.draw === true) {
        formattedResult = 0;
        odds = match.odds.draw;
    } else {
        if (match.winner === match.homeTeam) {
            formattedResult = 1; // The home team is the winner
            odds = teamID === match.HomeTeamId ? match.odds.home_win : match.odds.home_lose;
        } else {
            formattedResult = 2; // The away team is the loser
            odds = teamID === match.AwayTeamId ? match.odds.home_lose : match.odds.home_win;
        }
    }
    formattedData.push([teamID, formattedResult, odds]);
}

console.log(formattedData);
return Functions.encodeString(JSON.stringify(formattedData));