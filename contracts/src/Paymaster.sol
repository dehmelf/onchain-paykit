// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Paymaster {
    address public owner;
    mapping(address => bool) public allowlist;
    uint256 public maxSponsoredUsdPerHour;

    event Allowlist(address indexed merchant, bool ok);
    event SetMaxSponsored(uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "ONLY_OWNER"); _; }

    constructor() { owner = msg.sender; }

    function setAllowlist(address merchant, bool ok) external onlyOwner {
        allowlist[merchant] = ok;
        emit Allowlist(merchant, ok);
    }

    function setMaxSponsoredUsdPerHour(uint256 amount) external onlyOwner {
        maxSponsoredUsdPerHour = amount;
        emit SetMaxSponsored(amount);
    }

    // Placeholder for ERC-4337 validatePaymasterUserOp hook
    // function validatePaymasterUserOp(...) external returns (...) {}
} 