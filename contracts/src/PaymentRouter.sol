// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20, Types } from "./libs/Types.sol";
import { Errors } from "./libs/Errors.sol";
import { IMerchantRegistry } from "./interfaces/IMerchantRegistry.sol";

contract PaymentRouter {
    // Storage
    IMerchantRegistry public merchantRegistry;
    IERC20 public usdc;
    uint16 public feeBps;
    address public feeRecipient;
    address public usdcVault; // credited on successful payments

    mapping(bytes32 => bool) public usedIntentIds;

    // EIP-712
    bytes32 public constant EIP712_DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 public constant PAYMENT_INTENT_TYPEHASH = keccak256("PaymentIntent(address merchant,uint256 amount,uint256 expiresAt,bytes32 ref,address payer,bytes32 nonce)");
    bytes32 public immutable DOMAIN_SEPARATOR;

    event PaymentFulfilled(bytes32 indexed intentId, address indexed merchant, address indexed payer, uint256 amount, uint256 fee, bytes32 ref);
    event PaymentRefunded(bytes32 indexed intentId, address indexed merchant, address indexed payer, uint256 amount);

    constructor(address _registry, address _usdc, uint16 _feeBps, address _feeRecipient, address _usdcVault) {
        merchantRegistry = IMerchantRegistry(_registry);
        usdc = IERC20(_usdc);
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
        usdcVault = _usdcVault;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes("OnchainPayKit")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function quoteIntentId(Types.PaymentIntent calldata pi) public pure returns (bytes32) {
        return keccak256(abi.encode(
            keccak256("PaymentIntent(address merchant,uint256 amount,uint256 expiresAt,bytes32 ref,address payer,bytes32 nonce)"),
            pi.merchant,
            pi.amount,
            pi.expiresAt,
            pi.ref,
            pi.payer,
            pi.nonce
        ));
    }

    function _hashTypedData(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function _verifyServerSig(bytes32 intentId, bytes calldata serverSig) internal view returns (bool) {
        // MVP placeholder: accept non-empty sig. Replace with proper ECDSA recovery and signer allowlist.
        return serverSig.length > 0 && intentId != bytes32(0);
    }

    function pay(Types.PaymentIntent calldata pi, bytes calldata serverSig) external returns (bytes32 intentId) {
        if (!merchantRegistry.isMerchant(pi.merchant)) revert Errors.MerchantNotActive();
        if (pi.expiresAt < block.timestamp) revert Errors.IntentExpired();

        bytes32 structHash = keccak256(abi.encode(
            PAYMENT_INTENT_TYPEHASH,
            pi.merchant,
            pi.amount,
            pi.expiresAt,
            pi.ref,
            pi.payer,
            pi.nonce
        ));
        intentId = _hashTypedData(structHash);
        if (usedIntentIds[intentId]) revert Errors.IntentUsed();
        if (!_verifyServerSig(intentId, serverSig)) revert Errors.InvalidSignature();

        usedIntentIds[intentId] = true;

        uint16 merchantFeeBps = merchantRegistry.merchantFeeBps(pi.merchant);
        uint256 appliedFeeBps = merchantFeeBps > 0 ? merchantFeeBps : feeBps;
        uint256 feeAmount = (pi.amount * appliedFeeBps) / 10_000;
        uint256 merchantAmount = pi.amount - feeAmount;

        // Pull from payer (msg.sender expected to be AA smart account)
        require(usdc.transferFrom(msg.sender, feeRecipient, feeAmount), "FEE_TRANSFER_FAIL");
        require(usdc.transferFrom(msg.sender, usdcVault, merchantAmount), "VAULT_TRANSFER_FAIL");

        emit PaymentFulfilled(intentId, pi.merchant, msg.sender, pi.amount, feeAmount, pi.ref);
    }

    function refund(bytes32 intentId, address payer, uint256 amount) external {
        // Only merchant may call; simplified check through registry
        if (!merchantRegistry.isMerchant(msg.sender)) revert Errors.NotMerchant();
        // For MVP we emit event; actual USDC transfer should be performed by vault via separate flow
        emit PaymentRefunded(intentId, msg.sender, payer, amount);
    }
} 