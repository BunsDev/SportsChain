# Documentation : Gestion des Transactions dans SportsChain

## Introduction

Cette documentation détaille le processus de gestion des transactions dans le projet SportsChain. SportsChain est une plateforme de trading décentralisée où les tokens représentant les équipes sportives fluctuent en fonction des performances réelles des équipes. Ce guide couvre la configuration de la base de données MongoDB Atlas, la création et la gestion des transactions via des endpoints API avec Next.js, et des exemples de requêtes `curl` pour tester les fonctionnalités.

## Configuration de MongoDB Atlas

### 1. Créer un Cluster MongoDB Atlas
- **Créer un compte MongoDB Atlas** : [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Créer un nouveau cluster** : Sélectionnez une configuration gratuite (Free Tier).
- **Configurer les identifiants d'accès** :
  - Allez dans "Database Access" et créez un nouvel utilisateur avec un nom d'utilisateur et un mot de passe.
- **Configurer les permissions IP** :
  - Allez dans "Network Access" et ajoutez votre adresse IP actuelle.
- **Obtenir l'URI de connexion** : Copiez l'URI de connexion à utiliser dans votre application.

### 2. Installer et Configurer Mongoose

#### Installation de Mongoose

Mongoose est une bibliothèque ODM (Object Data Modeling) pour MongoDB et Node.js. Elle gère les relations entre les données, fournit des validations de schéma et est utilisée pour traduire le code entre les objets dans le code et la représentation de ces objets dans MongoDB.

Pour installer Mongoose, exécutez la commande suivante dans le terminal :

```bash
npm install mongoose
```

#### Création du fichier de configuration `lib/mongodb.js`

Ce fichier gère la connexion à la base de données MongoDB. Il utilise Mongoose pour se connecter à la base de données MongoDB Atlas. Voici le code complet avec des commentaires détaillés :

```javascript
// lib/mongodb.js
import mongoose from 'mongoose';

// Récupère l'URI de connexion MongoDB depuis les variables d'environnement
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Si l'URI n'est pas défini, une erreur est levée
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Caching de la connexion pour éviter de créer une nouvelle connexion à chaque requête
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Si une connexion existe déjà, elle est utilisée
  if (cached.conn) {
    console.log('Using existing database connection');
    return cached.conn;
  }

  // Si aucune connexion n'existe, une nouvelle connexion est créée
  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes au lieu de 30
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('New database connection established');
      return mongoose;
    }).catch(error => {
      console.error('Database connection error:', error);
      throw error;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
```

### 3. Définir le Modèle de Transaction

Le modèle de transaction définit la structure des documents de transaction dans la base de données MongoDB. Voici le code complet avec des commentaires détaillés :

```javascript
// lib/Transaction.js
import mongoose from 'mongoose';

// Définition du schéma de la transaction
const TransactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true, // Le champ est requis
  },
  teamId: {
    type: String,
    required: true, // Le champ est requis
  },
  amount: {
    type: Number,
    required: true, // Le champ est requis
  },
  transactionType: {
    type: String,
    required: true, // Le champ est requis
  },
  tokenPrice: {
    type: Number,
    required: true, // Le champ est requis
  },
  totalValue: {
    type: Number,
    required: true, // Le champ est requis
  },
  hash: {
    type: String,
    required: true, // Le champ est requis
  },
  date: {
    type: Date,
    default: Date.now, // Valeur par défaut : date actuelle
  },
});

// Création et exportation du modèle de transaction
export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
```

## Gestion des Transactions via API

### Endpoint API

Ce fichier gère les requêtes API pour les transactions. Il supporte les méthodes GET et POST pour récupérer et créer des transactions respectivement. Voici le code complet avec des commentaires détaillés :

```javascript
// pages/api/transactions.js
import dbConnect from '../../lib/mongodb';
import Transaction from '../../lib/Transaction';

// Fonction de gestionnaire pour les requêtes API
export default async function handler(req, res) {
  // Connexion à la base de données
  await dbConnect();

  // Gestion des méthodes de requêtes
  switch (req.method) {
    case 'GET':
      try {
        console.log('Handling GET request');
        // Récupération de toutes les transactions
        const transactions = await Transaction.find({});
        console.log('Transactions fetched successfully');
        // Envoi de la réponse avec les transactions récupérées
        res.status(200).json({ success: true, data: transactions });
      } catch (error) {
        console.error('Error fetching transactions:', error);
        // Envoi de la réponse en cas d'erreur
        res.status(500).json({ success: false, message: 'Error fetching transactions', error: error.message });
      }
      break;
    case 'POST':
      try {
        console.log('Handling POST request');
        const { userId, teamId, amount, transactionType, tokenPrice, hash } = req.body;
        console.log('Received data:', { userId, teamId, amount, transactionType, tokenPrice, hash });

        // Calcul de la valeur totale
        const totalValue = amount * tokenPrice;

        // Création d'une nouvelle transaction
        const newTransaction = new Transaction({
          userId,
          teamId,
          amount,
          transactionType,
          tokenPrice,
          totalValue,
          hash,
        });

        // Sauvegarde de la nouvelle transaction dans la base de données
        await newTransaction.save();
        console.log('Transaction saved:', newTransaction);

        // Envoi de la réponse avec la transaction créée
        res.status(201).json({ success: true, data: newTransaction });
      } catch (error) {
        console.error('Error saving transaction:', error);
        // Envoi de la réponse en cas d'erreur
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    default:
      console.log(`Method ${req.method} not allowed`);
      // Envoi de la réponse pour les méthodes non supportées
      res.status(405).json({ success: false, error: 'Method not allowed' });
      break;
  }
}
```

## Test des Endpoints API avec `curl`

### Requête GET pour Récupérer les Transactions

Cette requête permet de récupérer toutes les transactions enregistrées dans la base de données.

```bash
curl -X GET http://localhost:3000/api/transactions
```

### Requête POST pour Ajouter une Nouvelle Transaction

Cette requête permet d'ajouter une nouvelle transaction dans la base de données.

```bash
curl -X POST http://localhost:3000/api/transactions \
     -H "Content-Type: application/json" \
     -d '{
           "userId": "12345",
           "teamId": "67890",
           "amount": 100,
           "transactionType": "buy",
           "tokenPrice": 10,
           "hash": "0x123456789abcdef"
         }'
```

---

## Configuration de MongoDB Atlas (Suite)

### 4. Configuration des Variables d'Environnement

Pour que l'application Next.js puisse se connecter à MongoDB Atlas, vous devez définir l'URI de connexion dans les variables d'environnement.

1. **Créer un fichier `.env.local` à la racine du projet**.
2. **Ajouter la ligne suivante dans ce fichier** :

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority
```

Remplacez `<username>`, `<password>`, `<cluster-url>` et `<dbname>` par les informations de votre cluster MongoDB Atlas.

## Lancer l'Application

### 1. Installation des Dépendances

Avant de lancer l'application, assurez-vous d'installer toutes les dépendances nécessaires :

```bash
npm install
```

### 2. Lancer le Serveur Next.js

Pour lancer le serveur de développement Next.js, exécutez la commande suivante :

```bash
npm run dev
```

Le serveur de développement sera disponible à l'adresse `http://localhost:3000`.

## Test des Endpoints API avec `curl` (Suite)

### Vérification

 des Transactions

1. **Requête GET pour vérifier les transactions** :

```bash
curl -X GET http://localhost:3000/api/transactions
```

Vous devriez recevoir une réponse JSON contenant toutes les transactions enregistrées dans la base de données.

### Ajout de Transactions

2. **Requête POST pour ajouter une nouvelle transaction** :

```bash
curl -X POST http://localhost:3000/api/transactions \
     -H "Content-Type: application/json" \
     -d '{
           "userId": "12345",
           "teamId": "67890",
           "amount": 100,
           "transactionType": "buy",
           "tokenPrice": 10,
           "hash": "0x123456789abcdef"
         }'
```

Vous devriez recevoir une réponse JSON contenant les détails de la transaction nouvellement ajoutée.

## Dépannage et Résolution des Problèmes

### Problèmes Courants

1. **Problème de Connexion à MongoDB** :

   - Assurez-vous que l'URI MongoDB dans le fichier `.env.local` est correct.
   - Vérifiez que votre adresse IP est autorisée à se connecter à MongoDB Atlas.
   - Assurez-vous que le cluster MongoDB est en cours d'exécution et accessible.

2. **Erreurs de Requête API** :

   - Vérifiez les logs de votre serveur Next.js pour des messages d'erreur spécifiques.
   - Assurez-vous que les requêtes `curl` sont correctement formatées et envoient les données nécessaires.

### Ajout de Fonctionnalités

1. **Authentification** :

   - Ajoutez des middleware pour gérer l'authentification des utilisateurs avant de leur permettre d'effectuer des transactions.

2. **Validation des Données** :

   - Ajoutez des validations supplémentaires pour vérifier les données envoyées dans les requêtes POST afin de garantir leur intégrité et leur validité.

3. **Journalisation** :

   - Implémentez un système de journalisation pour suivre les activités des utilisateurs et les erreurs du système.



Pour toute question ou assistance supplémentaire, n'hésitez pas à consulter la [documentation officielle de MongoDB](https://docs.mongodb.com/) et la [documentation de Next.js](https://nextjs.org/docs).

