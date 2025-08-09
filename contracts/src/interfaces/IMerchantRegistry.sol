// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMerchantRegistry {
    function isMerchant(address who) external view returns (bool);
    function merchantFeeBps(address merchant) external view returns (uint16);
} 