const express = require('express');
const bodyParser = require('body-parser');
const ethers = require("ethers");

const app = express();
const port = 3000; // port of the API

app.use(bodyParser.json());

app.post('/api/match-results', async (req, res) => { //api endpoint
    const matchResults = req.body;
    console.log('Received match results:', matchResults);

    // Chainlink callback logic
    /* wrong
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-mumbai.infura.io/v3/YOUR_INFURA_PROJECT_ID');
    const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
    const contractAddress = 'YOUR_CONTRACT_ADDRESS';
    const contract = new ethers.Contract(contractAddress, abi, wallet);*/

    try {
        for (const [teamName, matches] of Object.entries(matchResults)) { //iteration in the dict {"FC Copenhagen":[{"matchResultId":19104340,"winner":"FC Copenhagen","loser":"Brøndby","draw":false,"odds":{"home_win":"2.97","away_win":"2.15","draw":"3.45","home_lose":"2.15","away_lose":"2.97"}}]
            for (const match of matches) { //if multiple matches per teams
                let result;
                if (match.draw === true) { //check the draw boolean
                    result = 0;
                    odds = match.odds.draw
                }
                else{
                    if (match.winner === teamName) { // check winning team
                        result = 1; // The team is the winner
                        odds = match.odds.home_win
                    } else {
                        result = 2; // The team is the loser
                        odds = match.odds.home_lose
                    }
                }
                
                console.log(teamName.toString());
                console.log(result);
                console.log(odds);
                /*
                const tx = await contract.fulfill(
                ethers.utils.formatBytes32String(teamName.toString()), //send the datas to the smart contract
                result, // Sending result
                odds // Sending odds
                );
                await tx.wait();*/
            }
        }
        res.status(200).json({ success: true });
    } catch (error) {
    console.error('Error sending data to the smart contract:', error);
    res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`External adapter listening at http://localhost:${port}`);
});