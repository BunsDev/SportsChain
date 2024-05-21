const axios = require('axios');

const API_TOKEN = 'cb593afb54874c6bb19321e6d22b0708';
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

async function fetchMatchResults(date) {
    try {
        const response = await axios.get(`https://api.sportsdata.io/v4/soccer/scores/json/SchedulesBasic/mls/2024?key=${API_TOKEN}`);
        const data = response.data.filter(match => match.Day.startsWith(date));
        console.log(data);
        return response.data.filter(match => match.Day.startsWith(date));
    } catch (error) {
        console.error(`Error fetching match results: ${error}`);
    }
}

async function fetchOdds(date) {
    try {
        const response = await axios.get(`https://api.sportsdata.io/v4/soccer/odds/json/GameOddsByDate/MLS/${date}?key=${API_TOKEN}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching odds: ${error}`);
    }
}

function getWinnerLoser(match) {
    const homeTeam = match.HomeTeamName;
    const awayTeam = match.AwayTeamName;
    const homeScore = match.HomeTeamScore;
    const awayScore = match.AwayTeamScore;
    const homePenaltyScore = match.HomeTeamScorePenalty;
    const awayPenaltyScore = match.AwayTeamScorePenalty;


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
        console.log(`Match ${match.GameId} result not yet received`);
    }

    return { winner, loser, draw };
}

function filterOdds(oddsData, gameId) {
    const relevantOdds = {
        home_win: null,
        draw: null,
        home_lose: null,
    };

    const gameOdds = oddsData.find(odds => odds.GameId === gameId);

    if (gameOdds && gameOdds.PregameOdds && gameOdds.PregameOdds.length > 0) {
        const marketOdds = gameOdds.PregameOdds[0];

        relevantOdds.home_win = marketOdds.HomeMoneyLine/100; // get the odds with a % form
        relevantOdds.draw = marketOdds.DrawMoneyLine/100;
        relevantOdds.home_lose = marketOdds.AwayMoneyLine/100;
    }

    return relevantOdds;
}

function formatData(matchResults) {
    let formattedData = [];
    for (const [teamName, matches] of Object.entries(matchResults)) {
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
    return formattedData;
}

async function resultSummary(date) {
    const results = {}; // Initialize the matches results dictionary

    const matchResults = await fetchMatchResults(date); // Get all matches on the given date
    const oddsData = await fetchOdds(date); // Get odds for the matches on the given date

    for (const matchResult of matchResults) {
        const { winner, loser, draw } = getWinnerLoser(matchResult);
        if (!winner) continue;

        const matchOdds = filterOdds(oddsData, matchResult.GameId);

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

    const formattedData = formatData(results);
    console.log(formattedData);
}

resultSummary(date);
