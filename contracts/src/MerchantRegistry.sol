// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MerchantRegistry {
    address public owner;

    mapping(address => bool) public isActive;
    mapping(address => uint16) public feeBpsOverride;
    mapping(address => string) public metadataURI;

    event Registered(address indexed merchant, string metadataURI, uint16 feeBps);
    event SetActive(address indexed merchant, bool active);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function register(address merchant, string calldata _metadataURI, uint16 feeBps) external onlyOwner {
        metadataURI[merchant] = _metadataURI;
        feeBpsOverride[merchant] = feeBps;
        isActive[merchant] = true;
        emit Registered(merchant, _metadataURI, feeBps);
    }

    function setActive(address merchant, bool active) external onlyOwner {
        isActive[merchant] = active;
        emit SetActive(merchant, active);
    }

    function merchantFeeBps(address merchant) external view returns (uint16) {
        return feeBpsOverride[merchant];
    }

    function isMerchant(address who) external view returns (bool) {
        return isActive[who];
    }
} 