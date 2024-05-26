const cron = require('node-cron');
const axios = require('axios');
const dbConnect = require('../lib/mongodb');
const Area = require('../models/Area');
const Player = require('../models/Player');
const Team = require('../models/Team');

const apiKey = process.env.SPORTSDATA_API_KEY;

async function fetchAndSaveData(endpoint, Model) {
  try {
    const response = await axios.get(endpoint, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey }
    });

    const data = response.data;

    await Promise.all(data.map(async (item) => {
      await Model.updateOne(
        { _id: item._id },
        { $set: item },
        { upsert: true }
      );
    }));

    console.log(`Successfully updated ${Model.modelName} data`);
  } catch (error) {
    console.error(`Error fetching ${Model.modelName} data:`, error);
  }
}

async function fetchData() {
  await dbConnect();

  await fetchAndSaveData('https://api.sportsdata.io/v3/soccer/scores/json/Areas', Area);
  await fetchAndSaveData('https://api.sportsdata.io/v3/soccer/scores/json/Players', Player);
  await fetchAndSaveData('https://api.sportsdata.io/v3/soccer/scores/json/Teams', Team);
}

// Schedule tasks to be run on the server.
cron.schedule('0 * * * *', () => {
  console.log('Fetching data every hour');
  fetchData();
});