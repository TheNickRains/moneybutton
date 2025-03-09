// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DestinationBridge is ERC20 {
    address public owner;
    // Used nonces to prevent replay attacks
    mapping(uint64 => bool) public usedNonces;

    event Minted(address indexed recipient, uint256 amount, uint64 nonce);

    constructor() ERC20("WrappedToken", "WTKN") {
        owner = msg.sender;
    }

    // Dummy VAA verification – replace with actual Wormhole VAA signature checks
    function verifyVAA(bytes memory vaa, uint64 nonce, uint256 amount) internal pure returns (bool) {
        // In production, call an external verifier or embed proper VAA verification logic
        return true;
    }

    function mintWrapped(
        address recipient,
        uint256 amount,
        uint64 nonce,
        bytes memory vaa
    ) external {
        require(!usedNonces[nonce], "Nonce already used");
        require(verifyVAA(vaa, nonce, amount), "Invalid VAA");
        usedNonces[nonce] = true;
        _mint(recipient, amount);
        emit Minted(recipient, amount, nonce);
    }
}
