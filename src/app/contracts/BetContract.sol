// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BetContract is Ownable {
    struct SupportedToken {
        address tokenContract;
        address priceFeed;
        uint8 decimals;
        bool enabled;
    }
    
    mapping(string => SupportedToken) public supportedTokens;
    uint256 public totalPotInUSD;
    
    event BetPlaced(address indexed user, string currency, uint256 amount, uint256 usdValue);
    event TokenBridged(address indexed user, string currency, uint256 amount);
    
    constructor() {
        // Initialize with some tokens
        supportedTokens["ETH"] = SupportedToken({
            tokenContract: address(0), // Native token
            priceFeed: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419, // ETH/USD feed
            decimals: 18,
            enabled: true
        });
        
        supportedTokens["USDC"] = SupportedToken({
            tokenContract: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, // USDC contract
            priceFeed: 0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6, // USDC/USD feed
            decimals: 6,
            enabled: true
        });
    }
    
    function addSupportedToken(
        string memory symbol,
        address tokenContract,
        address priceFeed,
        uint8 decimals
    ) external onlyOwner {
        supportedTokens[symbol] = SupportedToken({
            tokenContract: tokenContract,
            priceFeed: priceFeed,
            decimals: decimals,
            enabled: true
        });
    }
    
    function getLatestPrice(string memory symbol) public view returns (uint256) {
        SupportedToken memory token = supportedTokens[symbol];
        require(token.enabled, "Token not supported");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(token.priceFeed);
        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        
        return uint256(price);
    }
    
    function getUSDValue(string memory symbol, uint256 amount) public view returns (uint256) {
        SupportedToken memory token = supportedTokens[symbol];
        uint256 price = getLatestPrice(symbol);
        
        // Chainlink price feeds return prices with 8 decimals
        return (amount * price) / (10 ** (token.decimals + 8 - 18));
    }
    
    function placeBet(string memory symbol, uint256 amount) external payable {
        SupportedToken memory token = supportedTokens[symbol];
        require(token.enabled, "Token not supported");
        
        // Handle ETH
        if (token.tokenContract == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            // Handle ERC20 tokens
            require(msg.value == 0, "ETH not accepted for token bets");
            IERC20 erc20 = IERC20(token.tokenContract);
            require(erc20.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        }
        
        // Calculate USD value and add to pot
        uint256 usdValue = getUSDValue(symbol, amount);
        totalPotInUSD += usdValue;
        
        emit BetPlaced(msg.sender, symbol, amount, usdValue);
    }
} 