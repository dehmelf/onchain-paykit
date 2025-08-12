// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { MerchantRegistry } from "../src/MerchantRegistry.sol";
import { USDCVault } from "../src/USDCVault.sol";
import { PaymentRouter } from "../src/PaymentRouter.sol";
import { Paymaster } from "../src/Paymaster.sol";
import { FeeSplitter } from "../src/FeeSplitter.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Read environment variables
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        uint16 feeBps = uint16(vm.envUint("FEE_BPS"));
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying contracts with deployer:", deployer);
        console.log("USDC Address:", usdcAddress);
        console.log("Fee BPS:", feeBps);
        console.log("Fee Recipient:", feeRecipient);
        
        // Deploy MerchantRegistry
        MerchantRegistry registry = new MerchantRegistry();
        console.log("MerchantRegistry deployed at:", address(registry));
        
        // Deploy USDCVault
        USDCVault vault = new USDCVault(address(registry), address(0), usdcAddress);
        console.log("USDCVault deployed at:", address(vault));
        
        // Deploy PaymentRouter
        PaymentRouter router = new PaymentRouter(
            address(registry),
            usdcAddress,
            feeBps,
            feeRecipient,
            address(vault)
        );
        console.log("PaymentRouter deployed at:", address(router));
        
        // Deploy Paymaster
        Paymaster paymaster = new Paymaster();
        console.log("Paymaster deployed at:", address(paymaster));
        
        // Deploy FeeSplitter
        FeeSplitter feeSplitter = new FeeSplitter();
        console.log("FeeSplitter deployed at:", address(feeSplitter));
        
        // Update USDCVault with router address
        // Note: This requires the vault to have a setRouter function or redeploy
        // For now, we'll deploy with the correct router address
        USDCVault vaultWithRouter = new USDCVault(address(registry), address(router), usdcAddress);
        console.log("USDCVault (with router) deployed at:", address(vaultWithRouter));
        
        // Update PaymentRouter with correct vault address
        PaymentRouter routerWithVault = new PaymentRouter(
            address(registry),
            usdcAddress,
            feeBps,
            feeRecipient,
            address(vaultWithRouter)
        );
        console.log("PaymentRouter (with vault) deployed at:", address(routerWithVault));
        
        vm.stopBroadcast();
        
        // Output deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("MerchantRegistry:", address(registry));
        console.log("USDCVault:", address(vaultWithRouter));
        console.log("PaymentRouter:", address(routerWithVault));
        console.log("Paymaster:", address(paymaster));
        console.log("FeeSplitter:", address(feeSplitter));
        console.log("\nUpdate your .env file with these addresses!");
    }
} 