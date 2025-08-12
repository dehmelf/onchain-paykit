// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { Paymaster } from "../src/Paymaster.sol";

contract PaymasterTest is Test {
    Paymaster public paymaster;
    
    address public owner = address(this);
    address public merchant = address(0x123);
    address public nonOwner = address(0x456);
    
    function setUp() public {
        paymaster = new Paymaster();
    }
    
    function test_Constructor() public {
        assertEq(paymaster.owner(), owner, "Owner should be set correctly");
        assertEq(paymaster.maxSponsoredUsdPerHour(), 0, "Max sponsored should start at 0");
    }
    
    function test_SetAllowlist_OnlyOwner() public {
        vm.startPrank(nonOwner);
        vm.expectRevert("ONLY_OWNER");
        paymaster.setAllowlist(merchant, true);
        vm.stopPrank();
    }
    
    function test_SetAllowlist_Success() public {
        paymaster.setAllowlist(merchant, true);
        assertTrue(paymaster.allowlist(merchant), "Merchant should be allowlisted");
        
        paymaster.setAllowlist(merchant, false);
        assertFalse(paymaster.allowlist(merchant), "Merchant should be removed from allowlist");
    }
    
    function test_SetMaxSponsoredUsdPerHour_OnlyOwner() public {
        vm.startPrank(nonOwner);
        vm.expectRevert("ONLY_OWNER");
        paymaster.setMaxSponsoredUsdPerHour(1000);
        vm.stopPrank();
    }
    
    function test_SetMaxSponsoredUsdPerHour_Success() public {
        uint256 newMax = 1000;
        paymaster.setMaxSponsoredUsdPerHour(newMax);
        assertEq(paymaster.maxSponsoredUsdPerHour(), newMax, "Max sponsored should be updated");
    }
    
    function test_AllowlistEvents() public {
        vm.expectEmit(true, true, false, true);
        emit Paymaster.Allowlist(merchant, true);
        paymaster.setAllowlist(merchant, true);
        
        vm.expectEmit(true, true, false, true);
        emit Paymaster.Allowlist(merchant, false);
        paymaster.setAllowlist(merchant, false);
    }
    
    function test_MaxSponsoredEvents() public {
        uint256 newMax = 500;
        vm.expectEmit(true, false, false, true);
        emit Paymaster.SetMaxSponsored(newMax);
        paymaster.setMaxSponsoredUsdPerHour(newMax);
    }
    
    function test_AllowlistManagement() public {
        address[] memory merchants = new address[](3);
        merchants[0] = address(0x111);
        merchants[1] = address(0x222);
        merchants[2] = address(0x333);
        
        // Add all to allowlist
        for (uint i = 0; i < merchants.length; i++) {
            paymaster.setAllowlist(merchants[i], true);
            assertTrue(paymaster.allowlist(merchants[i]), "Merchant should be allowlisted");
        }
        
        // Remove all from allowlist
        for (uint i = 0; i < merchants.length; i++) {
            paymaster.setAllowlist(merchants[i], false);
            assertFalse(paymaster.allowlist(merchants[i]), "Merchant should be removed from allowlist");
        }
    }
    
    function test_OwnerPermissions() public {
        // Test that owner can perform all operations
        paymaster.setAllowlist(merchant, true);
        paymaster.setMaxSponsoredUsdPerHour(1000);
        
        assertTrue(paymaster.allowlist(merchant), "Owner should be able to set allowlist");
        assertEq(paymaster.maxSponsoredUsdPerHour(), 1000, "Owner should be able to set max sponsored");
    }
    
    function test_InitialState() public {
        // Test initial contract state
        assertEq(paymaster.owner(), owner, "Initial owner should be correct");
        assertEq(paymaster.maxSponsoredUsdPerHour(), 0, "Initial max sponsored should be 0");
        
        // Test that no merchant is allowlisted initially
        assertFalse(paymaster.allowlist(merchant), "New merchant should not be allowlisted");
        assertFalse(paymaster.allowlist(address(0x999)), "Random address should not be allowlisted");
    }
} 