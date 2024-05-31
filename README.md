# SportsChain: Sports tokens with prices updated by real-world team performance

## Introduction
SportsChain is a decentralized trading platform where tokens representing sports teams fluctuate in value based on the actual performance of the teams. The value of these ERC-20 tokens is dynamically updated using Chainlink Functions, reflecting real-world events such as wins and losses of the teams. This innovative approach provides a secure and transparent system for buying, selling, and tracking sports tokens, allowing users to invest in their favorite teams and see their investments grow as the teams perform well.


## Project Overview
The project consists of a frontend application built with NextJs and Chakra UI, a backend powered by Node.js and MongoDB, and smart contracts deployed on the Polygon blockchain. The application allows users to authenticate via Web3, view their token balances, and perform token transactions. Users benefit from the platform's ease of use, as their wallets are automatically created without the need to manage private keys. The price updates are requested to the smart contract using Chainlink Functions, ensuring real-time and reliable updates to token values based on team performance.

## Problem Being Solved

Most online betting companies are centralized, and often bets are placed on short-term events, such as a single match. With SportsChain, users can place bets on an entire season, providing a more comprehensive and long-term investment opportunity.

## Team
- **Gérald Quenum**: Gérald has been immersed in blockchain for ten years and a Blockchain developer for four years. He specializes in tokenization and creates secure solutions. Off-duty, he enjoys Flight Simulator. With four computers, a tablet, and three phones, Gérald always stays connected and creative.
- **Jhon doe**: Full Stack Developer with expertise in frontend and backend development for blockchain projects.



### Frontend
The frontend application is built with NextJS and Chakra UI. Key components and pages include:
- **Home Page (index.js)**: The entry point of the application, offering users options to create an account or log in.
- **Account Page (account.js)**: Allows users to view and update their account information and manage their tokens.
- **Token Trading Page (teams.js)**: Allows users to buy and sell tokens for various sports teams.

### Backend
The backend is powered by Node.js and MongoDB, consisting of several key modules:
- **Database Connection (mongodb.js)**: Handles connection to the MongoDB database.
- **Models**: Defines the schema for users, teams, players, transactions, and areas.
  - **User**
  - **Team**
  - **Player**
  - **Transaction**
  - **Area**
- **API Endpoints**: Manages various routes for handling player and team data.
  - **players.js**: Retrieves and updates player information.
  - **teams.js**: Retrieves and updates team information.
  - **transactions.js**: Manages token transactions.
- **Scheduled Tasks (scheduleFetch.js)**: Periodically fetches and updates data from external APIs.

### Smart Contracts
Smart contracts are deployed on the Ethereum blockchain to manage token minting, roles, and transactions.
- **tokenManager.sol**: Manages tokens for different teams, including minting and role assignments.




#### Issues Encountered
**Challenge 1: Gas Limit Constraints**
One of the primary challenges was managing the gas limit constraints for the callback functions in the smart contracts. Indeed the gas limit for the callback function is fixed at 300000. The initial gas usage exceeded the Chainlink gas limit, leading to failed transactions. To bypass this limitation we had to rethink how we used the callback function and transfer the conversion from byte to string of the returned data in a separate function.

**Challenge 2: Real-time Data Integration**
Integrating real-time sports data presented complexities in ensuring data accuracy and timeliness. Since the application should be fully autonomous, we needed to add scheduled jobs that would be operated at specific timing (blocking the trading when a match starts and unblocking/updating the prices when a match finishes).

**Challenge 3: API calls**
The initial API that was chosen (sportmonk API) wasn’t integrating properly within the chainlink functions (chainlink couldn’t call the API) which made us lose plenty of time to find the root cause of the issue, find another free API that provides the data we need and adapt our codes.

### Token Mechanism

- **Token Creation**: Tokens are created for each sports team and function as digital assets representing a share in the team's performance. Each token is linked to a specific team and is minted through smart contracts on the Polygon Amoy blockchain. This ensures that tokens are securely and transparently created and distributed.

- **Dynamic Pricing**: The prices of the tokens are dynamically adjusted based on real-time match results and betting odds. This is achieved through the integration of Chainlink function and the Sportsdata.io API, which provide accurate and timely data. The smart contracts automatically update token prices by analyzing the performance data, reflecting wins, losses, and draws in the token value. This dynamic adjustment ensures that token prices accurately represent the current performance and market sentiment of the respective teams.

- **Buying/Selling Tokens**: Users can buy and sell tokens on the Sport Chain platform based on their predictions of a team's future performance. The platform's smart contracts facilitate these transactions, ensuring they are executed in a secure and transparent manner. The user-friendly interface allows users to easily place buy and sell orders, and track their token portfolio. This trading mechanism provides a new way for fans and investors to engage with sports, offering potential financial rewards based on their sports knowledge and market speculation.


### Chainlink Integration

Sport Chain leverages Chainlink’s decentralized oracle network to ensure the reliability, security, and accuracy of the data used on the platform. By integrating Chainlink Functions, Sport Chain benefits from tamper-proof data sources and seamless connectivity to external APIs, which are critical for real-time data processing and dynamic token pricing. Here are the key aspects of Chainlink integration:

- **Fetching Match Results**: Chainlink’s decentralized oracles are used to fetch real-time match results from Sportsdata.io API. This integration ensures that the match data is accurate, timely, and resistant to tampering. The oracles query the Sportsdata.io API, retrieve match results, and deliver this data on-chain, where it is used by smart contracts to update token prices. This process is automated and occurs without the need for any centralized intermediary, enhancing the transparency and trustworthiness of the data.



- **Fetching Betting Odds**: Betting odds are a crucial component of Sport Chain’s token pricing mechanism. Chainlink oracles fetch these odds from reliable external sources, such as Sportsdata.io, and deliver them on-chain. By integrating betting odds into the platform, Sport Chain provides a comprehensive data-driven approach to token pricing. The odds reflect market sentiment and expectations about team performance, which are then used by smart contracts to dynamically adjust token prices. This integration ensures that the token values accurately represent both real-world performance and market perceptions.

- **Data Aggregation and Formatting**: Chainlink Functions not only fetch data but also format it according to the requirements of Sport Chain’s smart contracts. This involves aggregating data from multiple sources, filtering relevant information, and converting it into a format that can be efficiently processed on-chain. For example, Chainlink Functions can extract specific details such as team scores, match outcomes, and betting odds from the raw data provided by Sportsdata.io and prepare it for use in token pricing algorithms.

- **Automated Data Processing**: The integration with Chainlink allows Sport Chain to automate the entire process of data fetching, processing, and on-chain delivery. Smart contracts are triggered by predefined conditions, such as the completion of a match or the update of betting odds. Once triggered, Chainlink oracles automatically fetch the latest data, process it, and update the token prices accordingly. This automation ensures that the platform operates smoothly and efficiently, providing users with up-to-date and accurate token values.

#### Installation/Execution Process
1. **Clone the Repository**:
    ```sh
    git clone <repository_url>
    cd sportschain
    ```

2. **Backend Setup**:
    ```sh
    cd backend
    npm install
    ```

    - Set up environment variables in a `.env` file:
      ```env
      MONGO_URL=<your_mongo_url>
      SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
      SPORTSDATA_API_KEY=<your_api_key>
      ```

    - Start the backend server:
      ```sh
      node server.js
      ```

3. **Frontend Setup**:
    ```sh
    cd ../frontend
    npm install
    ```

    - Set up environment variables in a `.env.local` file:
      ```env
      NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=<your_web3auth_client_id>
      NEXT_PUBLIC_API_URL=http://localhost:3000/api
      ```

    - Start the frontend server:
      ```sh
      npm run dev
      ```
      
      
#### Open Source License
This project is licensed under the MIT License.
