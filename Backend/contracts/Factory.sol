// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./token.sol"; // Import the token contract interface
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract TokenManager is FunctionsClient{
    using FunctionsRequest for FunctionsRequest.Request;

    address router = 0xC22a79eBA640940ABB6dF0f7982cc119578E11De;

    struct TokenInfo {
        token token; // Token contract
        uint256 tokenPrice; // Price of one token in wei
    }
    mapping(uint256 => TokenInfo) public tokens;
    address public owner;
    bool public tradingBlocked;
    bytes public s_lastResponse;
    bytes32 public s_lastRequestId;
    bytes public s_lastError;
    string public requestData;

    // Event to log responses
    event Response(
        bytes32 indexed requestId,
        string requestData,
        bytes response,
        bytes err
    );

    // Store data from Chainlink
    struct GameData {
        uint256 result;
        uint256 odds;
    }
    mapping(uint256 => GameData) public gameData;
    // Custom error type
    error UnexpectedRequestID(bytes32 requestId);

    event Bought(address indexed buyer, uint256 teamID, uint256 amount);
    event Sold(address indexed seller, uint256 teamID, uint256 amount);
    event PriceUpdated(uint256 teamID, uint256 oldPrice, uint256 newPrice);
    event TradingBlocked();
    event TradingUnblocked();
    event Response(bytes32 indexed requestId, bytes response, bytes err);
    
    constructor() FunctionsClient(router){owner = msg.sender;}

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier tradingNotBlocked() { //lock the sell and buy functions during ongoing matches
        require(!tradingBlocked, "Trading is currently blocked");
        _;
    }

    function blockTrading() external onlyOwner { // call this function to lock trading
        tradingBlocked = true;
        emit TradingBlocked();
    }

    function unblockTrading() external onlyOwner { // call this function to unlock trading
        tradingBlocked = false;
        emit TradingUnblocked();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        mint(to, amount);
    }

    function burn(address addressFrom, uint256 amount) public onlyOwner{
        burn(addressFrom, amount);
    }

    function addToken(uint256 teamID, token tokenAddress, uint256 initialPrice) public onlyOwner { // Add token to be managed by the contract
        tokens[teamID] = TokenInfo({
            token: tokenAddress,
            tokenPrice: initialPrice
        });
    }

    function buyTokens(uint256 teamID) public payable tradingNotBlocked {
    TokenInfo storage tokenInfo = tokens[teamID];
    uint256 amountToBuy = msg.value / tokenInfo.tokenPrice;
    require(amountToBuy > 0, "Not enough funds sent");
    //mint(msg.sender, amountToBuy);
    uint256 contractBalance = tokenInfo.token.balanceOf(address(this)); //check the number of token owned by the contract
    if (amountToBuy > contractBalance) {
        uint256 amountToMint = amountToBuy - contractBalance; // mint token if the contract doesn't have enough tokens
        mintTokens(teamID, amountToMint);
    }

    tokenInfo.token.transfer(msg.sender, amountToBuy);
    emit Bought(msg.sender, teamID, amountToBuy);
}

    function sellTokens(uint256 teamID, uint256 amountToSell) public tradingNotBlocked payable {
        TokenInfo storage tokenInfo = tokens[teamID];
        require(amountToSell > 0, "You need to sell at least some tokens");

        uint256 allowance = tokenInfo.token.allowance(msg.sender, address(this));
        require(allowance >= amountToSell, "Check the token allowance");

        tokenInfo.token.transferFrom(msg.sender, address(this), amountToSell);
        payable(msg.sender).transfer(amountToSell * tokenInfo.tokenPrice);

        emit Sold(msg.sender, teamID, amountToSell);
    }

    function withdraw(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "Not enough balance");
        payable(owner).transfer(amount);
    }

    function mintTokens(uint256 teamID, uint256 amount) public onlyOwner {
        tokens[teamID].token.mint(address(this), amount);
    }

    // calculate the new price depending of the odds and the result of the match
    function calculateNewPrice(uint256 teamID, uint256 odds, uint256 result) private view returns (uint256) {
        uint256 newPrice;
        uint256 currentPrice = tokens[teamID].tokenPrice;
        if (result == 1) { // Win
            newPrice = currentPrice + (currentPrice * odds / 10000); //odds are int (ex:223 for 2,23)
        } else if (result == 2) { // Lose
            newPrice = currentPrice - (currentPrice * odds / 10000);
        } else { // Draw
            newPrice = currentPrice;
        }
        return newPrice;
    }

    function updatePrice(uint256 teamID, uint256 odds, uint256 result) public onlyOwner {
        uint256 newPrice = calculateNewPrice(teamID, odds, result); //update price based on the calculated new price
        require(newPrice > 0, "New price must be greater than 0");
        uint256 oldPrice = tokens[teamID].tokenPrice;
        tokens[teamID].tokenPrice = newPrice;
        emit PriceUpdated(teamID, oldPrice, newPrice);
    }

    // Chainlink request function
    function requestGameData(
        string memory source, // https://gist.github.com/stormerino78/509fc6d430bd9c2db94cdc62700315b5
        bytes memory encryptedSecretsUrls, //0x4c857a8cebfef344b845f22aee2c4fbf02cf1150b1681b9c3ff358eddb0ab1e83e5edcad27727083bfabb27f398f6eed18fb5ee2926e4b13f75428eefbbab693edbfb8aeab386197a99ee956929135aa462cade10ce84088a0ab17e4faa1e56abe4b4bc52765ada6023ebb76f790153e10ac98b6f1aa92392d110fa11632a590fb0f2c4ef290ecd854732f27e327ef2795e926d54896693042950df76f35bd7161
        string[] memory args, // ["1", "2024-05-18"]
        uint64 subscriptionId, //224
        uint32 gasLimit, //300000
        bytes32 donID //0x66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000
    ) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source); // Initialize the request with JS code
        if (encryptedSecretsUrls.length > 0)
            req.addSecretsReference(encryptedSecretsUrls); // Get the secret variables
        if (args.length > 0) req.setArgs(args); // Set the arguments for the request

        // Send the request and store the request ID
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );
        return s_lastRequestId;
    }

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId); // Check if request IDs match
        }
        // Update the contract's state variables with the response and any errors
        s_lastResponse = response;
        requestData = string(response);
        s_lastError = err;

        // Emit an event to log the response
        emit Response(requestId, requestData, s_lastResponse, s_lastError);
    }
}
