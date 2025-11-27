// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract test2 is ZamaEthereumConfig {
    euint8 a;

    constructor() {
        a = FHE.asEuint8(0);
        FHE.allowThis(a);
    }

    function myfunc() public returns (euint8) {
        FHE.allow(a, msg.sender);
        return a;
    }
}
