const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Charger les variables d'environnement à partir du fichier .env
dotenv.config();

// Obtenir la chaîne de connexion à partir des variables d'environnement
const uri = process.env.MONGODB_URI;

if (!uri || typeof uri !== 'string' || !uri.startsWith('mongodb')) {
  console.error('La chaîne de connexion MongoDB est invalide.');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri);

  try {
    // Connexion au client MongoDB
    await client.connect();

    // Connexion réussie
    console.log("Connexion réussie à MongoDB");

    // Vérifiez la connexion à la base de données
    const database = client.db('test'); // Remplacez par le nom de votre base de données
    const collection = database.collection('testCollection'); // Remplacez par le nom de votre collection

    const docCount = await collection.countDocuments();
    console.log(`Nombre de documents dans la collection : ${docCount}`);
  } catch (err) {
    // En cas d'erreur, affichez le message d'erreur
    console.error(`Erreur lors de la connexion à MongoDB : ${err}`);
  } finally {
    // Fermez la connexion au client MongoDB
    await client.close();
  }
}

run().catch(console.dir);