// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract SportsToken is ERC20, ChainlinkClient {
    using Chainlink for Chainlink.Request;

    address public admin; //Administrator that manage tokens
    uint256 public tokenprice;
    bool public tradingBlocked;
    
    // Chainlink variables
    address private oracle;
    bytes32 private jobId;
    uint256 private gasLimit;

    // Store data from Chainlink
    struct GameData {
        uint256 result;
        uint256 odds;
    }
    
    mapping(uint256 => GameData) public gameData;

    event TradingBlocked();
    event TradingUnblocked();
    event TokenPriceUpdated(uint256 newPrice);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        admin = msg.sender;
        tokenprice = 1;

        // Set the Chainlink token address for the network
        setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB); // Example LINK token address for Polygon
        oracle = 0x6Df09E975c830ECae5bd4eD9d90f3A95a4f88012; // Chainlink Oracle address
        jobId = "b7286d485fca455e9e9f0e400c791d7b"; // Job ID
        gasLimit = 0.2 * 10 ** 18; // Fee in LINK tokens
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier tradingNotBlocked() { //affect the lock to the sell and buy functions
        require(!tradingBlocked, "Trading is currently blocked");
        _;
    }

    function blockTrading() external onlyAdmin { // call this function to lock trading
        tradingBlocked = true;
        emit TradingBlocked();
    }

    function unblockTrading() external onlyAdmin { // call this function to unlock trading
        tradingBlocked = false;
        emit TradingUnblocked();
    }

    function mint(address addressTo, uint256 amount) public onlyOwner{
        _mint(addressTo, amount);
    }

    function burn(address addressFrom, uint256 amount) public onlyOwner{
        _burn(addressFrom, amount);
    }

    // Buy tokens
    function buyTokens() external payable tradingNotBlocked{
        require(msg.value > 0, "You need Matic/AVAX to buy tokens");
        uint256 amountToBuy = msg.value * getTokenPrice();
        mint(msg.sender, amountToBuy);
    }

    // Sell tokens
    function sellTokens(uint256 amount) external tradingNotBlocked{
        require(amount > 0 && balanceOf(msg.sender) >= amount, "Invalid balance");
        uint256 maticAmount = amount / getTokenPrice();
        burn(msg.sender, amount);
        payable(msg.sender).transfer(maticAmount);
    }
    
    function calculateNewPrice(uint256 currentPrice, uint256 odds, uint256 result) private pure returns (uint256) {
        uint256 newPrice;
        if (result == 1) { // Win
            newPrice = currentPrice + (currentPrice * odds / 100);
        } else if (result == 2) { // Lose
            newPrice = currentPrice - (currentPrice * odds / 100);
        } else { // Draw
            newPrice = currentPrice;
        }
        return newPrice;
    }

    function updatePrice(uint256 teamId) public {
        require(msg.sender == admin, "Only admin can update the price");
        GameData memory data = gameData[teamId];
        tokenprice = calculateNewPrice(tokenprice, data.odds, data.result);
    }

    function getTokenPrice() public view returns (uint256) {
        return tokenprice;  //1 MATIC = 1000 PSG
    }

    receive() external payable {}  // Accept MATIC sent directly to the contract

    // Chainlink request function
    function requestGameData(uint256 teamId) public {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        request.add("teamId", uint2str(teamId));
        sendChainlinkRequestTo(oracle, request, gasLimit);
    }

    // Chainlink callback function
    function fulfill(bytes32 _requestId, uint256 result, uint256 odds) public recordChainlinkFulfillment(_requestId) {
        uint256 teamId = uint256(_requestId); // Assuming teamId is encoded in requestId
        gameData[teamId] = GameData(result, odds);
    }

    // Helper function to convert uint256 to string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }
}
