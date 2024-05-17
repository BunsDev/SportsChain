const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

app.use(bodyParser.json());

app.post('/', async (req, res) => {
    const { id, data } = req.body;
    const { home_team, away_team, fixture_id } = data;

    try {
        // Fetch the match results and odds
        const oddsResponse = await axios.get(`https://api.sportmonks.com/v3/football/odds/pre-match/fixtures/${fixture_id}?api_token=${process.env.API_TOKEN}`);
        const oddsData = oddsResponse.data;
        
        // Format the results
        const relevantOdds = filter_odds(oddsData, home_team, away_team);
        
        // Respond with the formatted data
        res.json({
            jobRunID: id,
            data: relevantOdds,
            result: relevantOdds
        });
    } catch (error) {
        res.status(500).json({
            jobRunID: id,
            status: "errored",
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`External adapter listening at http://localhost:${port}`);
});

// Your filter_odds function here...
function filter_odds(odds_data, home_team, away_team) {
    let relevant_odds = {
        home_win: null,
        away_win: null,
        draw: null,
        home_lose: null,
        away_lose: null
    };

    if ('data' in odds_data) {
        for (let bookmaker of odds_data['data']) {
            let market_description = bookmaker['market_description'].toLowerCase();
            let label = bookmaker['label'].toLowerCase();
            
            if (market_description.includes('match winner')) {
                if (label === 'home') {
                    relevant_odds.home_win = bookmaker['value'];
                    relevant_odds.away_lose = bookmaker['value'];
                } else if (label === 'away') {
                    relevant_odds.away_win = bookmaker['value'];
                    relevant_odds.home_lose = bookmaker['value'];
                } else if (label === 'draw') {
                    relevant_odds.draw = bookmaker['value'];
                }
            }
        }
    }
    return relevant_odds;
}
