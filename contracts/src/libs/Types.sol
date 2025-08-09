// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function decimals() external view returns (uint8);
}

library Types {
    struct PaymentIntent {
        address merchant;
        uint256 amount;      // in USDC (6 decimals)
        uint256 expiresAt;   // unix
        bytes32 ref;         // merchant ref / order id
        address payer;       // optional (0 for open)
        bytes32 nonce;       // server-side unique
    }
} 