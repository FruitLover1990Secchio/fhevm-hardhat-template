// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FHE, euint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IP {
    function evaluatePolicy(address _subject) external returns (euint8);
}

contract SmartResource is ZamaEthereumConfig {
    enum RuleEffect {
        PERMIT,
        DENY,
        NOTAPPLICABLE,
        INDETERMINATE
    }

    euint8 decision;
    address public immutable owner;
    address public policy;

    event ResultReady(euint8 decision);

    constructor() {
        owner = msg.sender;
    }

    function setPolicy(address newPolicy) public onlyContractOwner {
        policy = newPolicy;
    }

    function requestAccess() public {
        decision = IP(policy).evaluatePolicy(msg.sender);
        FHE.makePubliclyDecryptable(decision);

        // send the request to the subject
        emit ResultReady(decision);
    }

    function accessResource(bytes memory encodedResult, bytes memory decryptionProof) public {
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(decision);

        // This FHE call reverts the transaction if the decryption proof is invalid.
        FHE.checkSignatures(cts, encodedResult, decryptionProof);
        require(abi.decode(encodedResult, (uint8)) == uint8(RuleEffect.PERMIT), "Policy decision is not PERMIT.");

        // access logic
    }

    modifier onlyContractOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }
}
