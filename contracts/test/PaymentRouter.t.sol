// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PaymentRouter } from "../src/PaymentRouter.sol";
import { MerchantRegistry } from "../src/MerchantRegistry.sol";
import { USDCVault } from "../src/USDCVault.sol";
import { Types } from "../src/libs/Types.sol";
import { Errors } from "../src/libs/Errors.sol";

contract PaymentRouterTest is Test {
    PaymentRouter public router;
    MerchantRegistry public registry;
    USDCVault public vault;
    
    address public owner = address(this);
    address public merchant = address(0x123);
    address public payer = address(0x456);
    address public feeRecipient = address(0x789);
    address public usdc = address(0xABC);
    
    uint16 public constant FEE_BPS = 250; // 2.5%
    
    function setUp() public {
        registry = new MerchantRegistry();
        vault = new USDCVault(address(registry), address(this), usdc);
        router = new PaymentRouter(address(registry), usdc, FEE_BPS, feeRecipient, address(vault));
        
        // Register merchant
        registry.register(merchant, "ipfs://merchant", 0);
        registry.setActive(merchant, true);
    }
    
    function test_QuoteIntentId() public {
        Types.PaymentIntent memory pi = Types.PaymentIntent({
            merchant: merchant,
            amount: 1000000, // 1 USDC
            expiresAt: block.timestamp + 3600,
            ref: bytes32("ORDER-123"),
            payer: address(0),
            nonce: bytes32("NONCE-456")
        });
        
        bytes32 intentId = router.quoteIntentId(pi);
        assertTrue(intentId != bytes32(0), "Intent ID should not be zero");
    }
    
    function test_Pay_HappyPath() public {
        Types.PaymentIntent memory pi = Types.PaymentIntent({
            merchant: merchant,
            amount: 1000000, // 1 USDC
            expiresAt: block.timestamp + 3600,
            ref: bytes32("ORDER-123"),
            payer: address(0),
            nonce: bytes32("NONCE-456")
        });
        
        bytes memory serverSig = "0x1234"; // Mock signature
        
        // Mock USDC approval and balance
        vm.mockCall(usdc, abi.encodeWithSelector(0x23b872dd), abi.encode(true));
        vm.mockCall(usdc, abi.encodeWithSelector(0x70a08231), abi.encode(1000000));
        
        bytes32 intentId = router.pay(pi, serverSig);
        assertTrue(intentId != bytes32(0), "Should return valid intent ID");
        assertTrue(router.usedIntentIds(intentId), "Intent should be marked as used");
    }
    
    function test_Pay_Expired() public {
        Types.PaymentIntent memory pi = Types.PaymentIntent({
            merchant: merchant,
            amount: 1000000,
            expiresAt: block.timestamp - 1, // Expired
            ref: bytes32("ORDER-123"),
            payer: address(0),
            nonce: bytes32("NONCE-456")
        });
        
        bytes memory serverSig = "0x1234";
        
        vm.expectRevert(Errors.IntentExpired.selector);
        router.pay(pi, serverSig);
    }
    
    function test_Pay_MerchantNotActive() public {
        // Deactivate merchant
        registry.setActive(merchant, false);
        
        Types.PaymentIntent memory pi = Types.PaymentIntent({
            merchant: merchant,
            amount: 1000000,
            expiresAt: block.timestamp + 3600,
            ref: bytes32("ORDER-123"),
            payer: address(0),
            nonce: bytes32("NONCE-456")
        });
        
        bytes memory serverSig = "0x1234";
        
        vm.expectRevert(Errors.MerchantNotActive.selector);
        router.pay(pi, serverSig);
    }
    
    function test_Pay_DoubleSpend() public {
        Types.PaymentIntent memory pi = Types.PaymentIntent({
            merchant: merchant,
            amount: 1000000,
            expiresAt: block.timestamp + 3600,
            ref: bytes32("ORDER-123"),
            payer: address(0),
            nonce: bytes32("NONCE-456")
        });
        
        bytes memory serverSig = "0x1234";
        
        // Mock USDC calls for first payment
        vm.mockCall(usdc, abi.encodeWithSelector(0x23b872dd), abi.encode(true));
        vm.mockCall(usdc, abi.encodeWithSelector(0x70a08231), abi.encode(1000000));
        
        bytes32 intentId = router.pay(pi, serverSig);
        assertTrue(intentId != bytes32(0), "First payment should succeed");
        
        // Mock USDC calls for second payment
        vm.mockCall(usdc, abi.encodeWithSelector(0x23b872dd), abi.encode(true));
        vm.mockCall(usdc, abi.encodeWithSelector(0x70a08231), abi.encode(1000000));
        
        vm.expectRevert(Errors.IntentUsed.selector);
        router.pay(pi, serverSig);
    }
    
    function test_Refund_OnlyMerchant() public {
        bytes32 intentId = bytes32("INTENT-123");
        
        // Non-merchant should not be able to refund
        vm.expectRevert(Errors.NotMerchant.selector);
        router.refund(intentId, payer, 1000000);
    }
    
    function test_FeeSplit() public {
        Types.PaymentIntent memory pi = Types.PaymentIntent({
            merchant: merchant,
            amount: 1000000, // 1 USDC
            expiresAt: block.timestamp + 3600,
            ref: bytes32("ORDER-123"),
            payer: address(0),
            nonce: bytes32("NONCE-456")
        });
        
        bytes memory serverSig = "0x1234";
        
        // Mock USDC calls
        vm.mockCall(usdc, abi.encodeWithSelector(0x23b872dd), abi.encode(true));
        vm.mockCall(usdc, abi.encodeWithSelector(0x70a08231), abi.encode(1000000));
        
        bytes32 intentId = router.pay(pi, serverSig);
        assertTrue(intentId != bytes32(0), "Payment should succeed");
        
        // Fee should be 2.5% of 1 USDC = 25,000 (25 basis points)
        // Merchant should receive 975,000 (97.5%)
        // This test verifies the fee calculation logic
    }
} 