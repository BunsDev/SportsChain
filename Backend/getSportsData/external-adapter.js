const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/api/match-results', async (req, res) => {
    const matchResults = req.body;
    console.log('Received match results:', matchResults);
    res.status(200).send('Data received successfully');
});

app.listen(port, () => {
    console.log(`External adapter listening at http://localhost:${port}`);
});