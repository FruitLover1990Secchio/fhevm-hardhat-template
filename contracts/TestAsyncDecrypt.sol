// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract TestAsyncDecrypt is ZamaEthereumConfig {
    ebool xBool;
    bool public yBool;
    bool isDecryptionPending;
    uint256 latestRequestId;

    event ToDecrypt(ebool result);

    constructor() {
        xBool = FHE.asEbool(true);
        FHE.allowThis(xBool);
    }

    function requestBool() public {
        require(!isDecryptionPending, "Decryption is in progress");
        FHE.makePubliclyDecryptable(xBool);
        emit ToDecrypt(xBool);
    }

    function myCustomCallback(bytes memory encodedResult, bytes memory decryptionProof) public {
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(xBool);

        // This FHE call reverts the transaction if the decryption proof is invalid.
        FHE.checkSignatures(cts, encodedResult, decryptionProof);
        yBool = abi.decode(encodedResult, (bool));
    }

    function setXBool(bool flag) public {
        xBool = FHE.asEbool(flag);
        FHE.allowThis(xBool);
    }
}
