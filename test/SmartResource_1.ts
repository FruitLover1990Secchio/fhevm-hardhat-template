import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, deployments, fhevm } from "hardhat";
import { AMContract, SmartResource, SmartPolicy_1_1 } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { bigint } from "hardhat/internal/core/params/argumentTypes";

/**
 * @dev
 * - AM: Attribute Manager
 * - RO: Resource Owner
 * - SJ: Subject
 */
type CustomSigners = {
  AM: HardhatEthersSigner;
  RO: HardhatEthersSigner;
  SJ: HardhatEthersSigner;
};

enum RuleEffect {
  PERMIT,
  DENY,
  NOTAPPLICABLE,
  INDETERMINATE,
}

describe("SmartResource_1", function () {
  let signers: CustomSigners;
  let smartResource: SmartResource;
  let smartResourceAddress: string;
  let amContract: AMContract;
  let amContractAddress: string;
  let smartPolicy: SmartPolicy_1_1;
  let smartPolicyAddress: string;

  before(async function () {
    let Deployement = await deployments.get("SmartResource");
    smartResourceAddress = Deployement.address;
    smartResource = await ethers.getContractAt("SmartResource", Deployement.address);

    Deployement = await deployments.get("AMContract");
    amContractAddress = Deployement.address;
    amContract = await ethers.getContractAt("AMContract", Deployement.address);

    Deployement = await deployments.get("SmartPolicy_1_1");
    smartPolicyAddress = Deployement.address;
    smartPolicy = await ethers.getContractAt("SmartPolicy_1_1", Deployement.address);

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { AM: ethSigners[0], RO: ethSigners[1], SJ: ethSigners[2] };
  });

  it("should update attribute values", async function () {

    const valueStr = "bachelor student";

    let tx = await amContract.connect(signers.AM).createPublicStringAttribute("subjectRole", signers.SJ, valueStr);
    await tx.wait();

    const avgGrade = 28;
    const encryptedValue = await fhevm
      .createEncryptedInput(amContractAddress, signers.AM.address)
      .add8(avgGrade)
      .encrypt();

    tx = await amContract
      .connect(signers.AM)
      .createPrivateAttribute("gradeAverage", signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    const enrollmentYear = 2;
    tx = await amContract.connect(signers.AM).createPublicIntAttribute("enrollmentYear", signers.SJ, enrollmentYear);
    await tx.wait();

    tx = await smartResource.connect(signers.RO).setPolicy(smartPolicyAddress);
    await tx.wait();
  }).timeout(4 * 10 ** 5);

  it("should compute true", async function () {
    const tx = await smartResource.connect(signers.SJ).requestAccess();
    const receipt = (await tx.wait());
    console.log(receipt?.gasUsed);
/*
    const logs = receipt?.logs;

    if (logs == undefined) {
      return;
    }
    let encryptedResult;
    for (const log of logs) {
      if (log.address == smartResourceAddress) {
        encryptedResult = log.args[0];
        console.log(encryptedResult);
      }
    }
    
    const publicDecryptResults = await fhevm.publicDecrypt([encryptedResult]);
    const abiEncodedPolicyEvaluation = publicDecryptResults.abiEncodedClearValues;
    const decryptionProof = publicDecryptResults.decryptionProof;
    
    const tx2 = await smartResource.connect(signers.SJ).accessResource(abiEncodedPolicyEvaluation, decryptionProof);
    await tx2.wait();
    // transaction will revert if decision != PERMIT*/
  }).timeout(4 * 10 ** 5);
});
