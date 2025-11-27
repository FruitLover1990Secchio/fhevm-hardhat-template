// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract AMContract is ZamaEthereumConfig {
    // inverting address and string caused a 2x gas used during transaction execution
    mapping(address => mapping(string => euint8)) private privateAttributes;
    mapping(address => mapping(string => string)) public publicStringAttributes;
    mapping(address => mapping(string => int)) public publicIntAttributes;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function createPrivateAttribute(
        string calldata attribute,
        address subject,
        externalEuint8 val,
        bytes calldata inputProof
    ) public onlyContractOwner {
        privateAttributes[subject][attribute] = FHE.fromExternal(val, inputProof);
        FHE.allowThis(privateAttributes[subject][attribute]);
    }

    function createPublicStringAttribute(
        string calldata attribute,
        address subject,
        string calldata val
    ) public onlyContractOwner {
        publicStringAttributes[subject][attribute] = val;
    }

    function createPublicIntAttribute(string calldata attribute, address subject, int val) public onlyContractOwner {
        publicIntAttributes[subject][attribute] = val;
    }

    function getPrivateValue(address subject, string calldata attribute) external returns (euint8) {
        FHE.allowTransient(privateAttributes[subject][attribute], msg.sender);
        return privateAttributes[subject][attribute];
    }

    function getPublicStringValue(address subject, string calldata attribute) external view returns (string memory) {
        return publicStringAttributes[subject][attribute];
    }

    function getPublicIntValue(address subject, string calldata attribute) external view returns (int) {
        return publicIntAttributes[subject][attribute];
    }

    modifier onlyContractOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }
}
