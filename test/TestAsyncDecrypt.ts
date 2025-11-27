import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, deployments, fhevm } from "hardhat";
import { TestAsyncDecrypt } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { sign } from "crypto";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

describe("TestAsyncDecrypt", function(){

    let TestAsyncDecryptContract: TestAsyncDecrypt;
    let TestAsyncDecryptAddress: string;
    let signers:Signers;

    before(async function(){
        const deployment = await deployments.get("TestAsyncDecrypt");
        TestAsyncDecryptAddress = deployment.address;
        TestAsyncDecryptContract = await ethers.getContractAt("TestAsyncDecrypt", deployment.address);

        const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
        signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
    });

    it("set and get works fine", async function () {

        const set_tx = await TestAsyncDecryptContract.connect(signers.deployer).setXBool(true);
        await set_tx.wait();

        const tx = await TestAsyncDecryptContract.connect(signers.deployer).requestBool();
        const receipt = (await tx.wait())?.logs;


        let handle:string;
        if(receipt == undefined)return;
        for (const log of receipt){
            if(log.address == TestAsyncDecryptAddress){
                handle = log.args[0];
                console.log("Handle is: " +  handle + "\n");
            }
        }

        const publicDecryptResults = await fhevm.publicDecrypt([handle]);

        // The Relayer returns a `PublicDecryptResults` object containing:
        // - the ORDERED clear values (here we have only one single value)
        // - the ORDERED clear values in ABI-encoded form
        // - the KMS decryption proof associated with the ORDERED clear values in ABI-encoded form
        const abiEncodedClearGameResult = publicDecryptResults.abiEncodedClearValues;
        const decryptionProof = publicDecryptResults.decryptionProof;

        const tx2 = await TestAsyncDecryptContract.connect(signers.deployer).myCustomCallback(abiEncodedClearGameResult, decryptionProof);
        tx2.wait();

        const tx3 = await TestAsyncDecryptContract.yBool();
        expect(tx3).to.eq(true);
    });


});