// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Types } from "../libs/Types.sol";

interface IPaymentRouter {
    event PaymentFulfilled(bytes32 indexed intentId, address indexed merchant, address indexed payer, uint256 amount, uint256 fee, bytes32 ref);
    event PaymentRefunded(bytes32 indexed intentId, address indexed merchant, address indexed payer, uint256 amount);

    function quoteIntentId(Types.PaymentIntent calldata pi) external pure returns (bytes32);

    function pay(Types.PaymentIntent calldata pi, bytes calldata serverSig) external returns (bytes32 intentId);

    function refund(bytes32 intentId, address payer, uint256 amount) external;
} 