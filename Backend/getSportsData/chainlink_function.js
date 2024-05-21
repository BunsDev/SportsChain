/*
Chainlink function that operates with match ID
*/

const apiKey = secrets.API_KEY
if (!apiKey) {
    throw Error("API key required");
}

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

const date = '2024-05-18';

const results = {}; // Initialize the matches results dictionary

// Fetch match results

const getMatches  = await Functions.makeHttpRequest({url: `https://api.sportsdata.io/v4/soccer/scores/json/SchedulesBasic/mls/2024?key=${apiKey}`});
const matchResults = getMatches.data.filter(match => match.Day.startsWith(date));
//console.log(JSON.stringify(matchResults, null ,2));
if (getMatches.error) {
    console.log(getMatches.error);
    throw Error("Request Matches datas failed");
}

const getOdds = await Functions.makeHttpRequest({url:`https://api.sportsdata.io/v4/soccer/odds/json/GameOddsByDate/MLS/${date}?key=${apiKey}`});
const oddsData = getOdds.data;
//console.log(JSON.stringify(oddsData, null ,2));
if (getOdds.error) {
    console.log(getOdds.error);
    throw Error("Request Odds datas failed");
}

for (const matchResult of matchResults) {
    const homeTeam = matchResult.HomeTeamName;
    const awayTeam = matchResult.AwayTeamName;
    const homeScore = matchResult.HomeTeamScore;
    const awayScore = matchResult.AwayTeamScore;
    const homePenaltyScore = matchResult.HomeTeamScorePenalty;
    const awayPenaltyScore = matchResult.AwayTeamScorePenalty;


    let winner = null;
    let loser = null;
    let draw = false;

    if (homeScore !== null && awayScore !== null) {
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
    const matchOdds = {
        home_win: null,
        draw: null,
        home_lose: null,
    };

    const gameOdds = oddsData.find(odds => odds.GameId === matchResult.GameId);

    if (gameOdds && gameOdds.PregameOdds && gameOdds.PregameOdds.length > 0) {
        const marketOdds = gameOdds.PregameOdds[0];

        matchOdds.home_win = marketOdds.HomeMoneyLine/100; // get the odds with a % form
        matchOdds.draw = marketOdds.DrawMoneyLine/100;
        matchOdds.home_lose = marketOdds.AwayMoneyLine/100;
    }
    const matchInfo = {
        matchResultId: matchResult.GameId,
        winner,
        loser,
        draw,
        odds: matchOdds,
        };

        const teamName1 = matchResult.HomeTeamName;
        const teamName2 = matchResult.AwayTeamName;

        results[teamName1] = results[teamName1] || [];
        results[teamName1].push(matchInfo);

        results[teamName2] = results[teamName2] || [];
        results[teamName2].push(matchInfo);

        if (draw) {
        console.log(`${teamName1} vs ${teamName2} Match Result: ${winner} ended in a draw against ${loser}, Odds: ${JSON.stringify(matchOdds)}`);
        } else {
        if (winner === teamName1) {
            console.log(`${teamName1} Match Result: ${winner} won against ${loser}, Odds: ${JSON.stringify(matchOdds)}`);
        } else if (loser === teamName1) {
            console.log(`${teamName1} Match Result: ${loser} lost against ${winner}, Odds: ${JSON.stringify(matchOdds)}`);
        }
        if (winner === teamName2) {
            console.log(`${teamName2} Match Result: ${winner} won against ${loser}, Odds: ${JSON.stringify(matchOdds)}`);
        } else if (loser === teamName2) {
            console.log(`${teamName2} Match Result: ${loser} lost against ${winner}, Odds: ${JSON.stringify(matchOdds)}`);
        } else {
            console.log(`Failed to fetch match results for ${teamName1} or ${teamName2}`);
        }
    }
}
let formattedData = [];
    for (const [teamName, matches] of Object.entries(results)) {
        for (const match of matches) {
        let formattedResult;
        let odds;
        if (match.draw === true) {
            formattedResult = 0;
            odds = match.odds.draw;
        } else {
            if (match.winner === teamName) {
            formattedResult = 1; // The team is the winner
            odds = match.odds.home_win;
            } else {
            formattedResult = 2; // The team is the loser
            odds = match.odds.home_lose;
            }
        }
        formattedData.push([teamName, formattedResult, odds]);
        }
    }

console.log(formattedData);
return Functions.encodeString(JSON.stringify(formattedData));