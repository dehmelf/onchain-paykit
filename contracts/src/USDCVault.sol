// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "./libs/Types.sol";
import { IMerchantRegistry } from "./interfaces/IMerchantRegistry.sol";
import { Errors } from "./libs/Errors.sol";

contract USDCVault {
    IMerchantRegistry public immutable merchantRegistry;
    address public immutable router;
    IERC20 public immutable usdc;

    mapping(address => uint256) public balanceOf;

    event Payout(address indexed merchant, address indexed to, uint256 amount);

    modifier onlyRouter() {
        if (msg.sender != router) revert Errors.NotRouter();
        _;
    }

    modifier onlyMerchant() {
        if (!merchantRegistry.isMerchant(msg.sender)) revert Errors.NotMerchant();
        _;
    }

    constructor(address _registry, address _router, address _usdc) {
        merchantRegistry = IMerchantRegistry(_registry);
        router = _router;
        usdc = IERC20(_usdc);
    }

    function credit(address merchant, uint256 amount) external onlyRouter {
        balanceOf[merchant] += amount;
    }

    function debit(address merchant, uint256 amount, address to) external onlyMerchant {
        if (balanceOf[merchant] < amount) revert Errors.InsufficientBalance();
        balanceOf[merchant] -= amount;
        require(usdc.transfer(to, amount), "USDC_TRANSFER_FAIL");
        emit Payout(merchant, to, amount);
    }
} 