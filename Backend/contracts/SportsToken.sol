// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SportsToken is ERC20 {

    address public admin; //Administrator that manage tokens
    uint256 public tokenprice;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        admin = msg.sender;
        _mint(admin, 1000000 * 10 ** decimals());  // 1000000 token
    }

    function mint(address addressTo, uint256 amount) public {
        require(msg.sender == admin, "Only the admin account can emit tokens");
        _mint(addressTo, amount);
    }

    function burn(address addressFrom, uint256 amount) public {
        require(msg.sender == admin, "Only the admin account can burn tokens");
        _burn(addressFrom, amount);
    }

    // Buy tokens
    function buyTokens() external payable {
        require(msg.value > 0, "You need Matic/AVAX to buy tokens");
        uint256 amountToBuy = msg.value * getTokenPrice();
        mint(msg.sender, amountToBuy);
    }

    // Sell tokens
    function sellTokens(uint256 amount) external {
        require(amount > 0 && balanceOf(msg.sender) >= amount, "Invalid balance");
        uint256 maticAmount = amount / getTokenPrice();
        burn(msg.sender, amount);
        payable(msg.sender).transfer(maticAmount);
    }

    function getTokenPrice() public pure returns (uint256) {
        return 1000;  //1 MATIC = 1000 PSG
    }

    receive() external payable {}  // Accept MATIC sent directly to the contract
}
