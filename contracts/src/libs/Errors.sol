// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Errors {
    error IntentExpired();
    error IntentUsed();
    error AmountMismatch();
    error MerchantNotActive();
    error InvalidSignature();
    error NotMerchant();
    error NotRouter();
    error InsufficientBalance();
} 