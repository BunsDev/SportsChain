// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./SportsToken.sol";

contract TokenFactory {
    address public owner;
    SportsToken[] public deployedTokens;

    constructor() {
        owner = msg.sender;
    }
    function createToken(string memory name, string memory symbol) public {
        require(msg.sender == owner, "Only owner can create new tokens");
        SportsToken newToken = new SportsToken(name, symbol);
        deployedTokens.push(newToken);
    }

    function getDeployedTokens() public view returns (SportsToken[] memory) {
        return deployedTokens;
    }
}


/* Other not integrated functions 

function requestGameData(uint256 teamId, string memory date) public returns (bytes32 requestId) {
        Chainlink.Request memory request = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        request._addUint("teamId", teamId);
        request._add("date", date);
        request._add("path", "result"); // Result key from API ? 
        return _sendChainlinkRequestTo(oracle, request, fee);
    }

    function fulfill(bytes32 _requestId, uint256 teamId, uint256 matchResult, uint256 bettingOdds) public recordChainlinkFulfillment(_requestId) {
        uint256 oldPrice = tokenPrices[teamId];
        uint256 newPrice = calculateNewPrice(oldPrice, bettingOdds, matchResult);
        tokenPrices[teamId] = newPrice;
        emit PriceUpdated(teamId, oldPrice, newPrice);
    }
    
    function calculateNewPrice(uint256 currentPrice, uint256 odds, uint256 result) private pure returns (uint256) {
        int256 signedResult;
        if (result == 1) { // Win
            signedResult = 1;
        } else if (result == 2) { // Loose
            signedResult = -1;
        } else { // Draw
            signedResult = 0;
        }
        return uint256(int256(currentPrice) + (int256(currentPrice) * int256(odds) * signedResult / 100));
    }

*/