import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, deployments, fhevm } from "hardhat";
import { AMContract, SmartResource, SmartPolicyExample } from "../types";
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

describe("SmartResource", function () {
  let signers: CustomSigners;
  let smartResource: SmartResource;
  let smartResourceAddress: string;
  let amContract: AMContract;
  let amContractAddress: string;
  let smartPolicy: SmartPolicyExample;
  let smartPolicyAddress: string;

  before(async function () {
    let Deployement = await deployments.get("SmartResource");
    smartResourceAddress = Deployement.address;
    smartResource = await ethers.getContractAt("SmartResource", Deployement.address);

    Deployement = await deployments.get("AMContract");
    amContractAddress = Deployement.address;
    amContract = await ethers.getContractAt("AMContract", Deployement.address);

    Deployement = await deployments.get("SmartPolicyExample");
    smartPolicyAddress = Deployement.address;
    smartPolicy = await ethers.getContractAt("SmartPolicyExample", Deployement.address);

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { AM: ethSigners[0], RO: ethSigners[1], SJ: ethSigners[2] };
  });

  it("aggiorna valori", async function(){
    const valueStr = "bachelor student";
    const avgGrade = 28;
    const encryptedValue = await fhevm
      .createEncryptedInput(amContractAddress, signers.AM.address)
      .add8(avgGrade)
      .encrypt();

    let tx = await amContract
      .connect(signers.AM)
      .createPrivateAttribute("gradeAverage", signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
    const receipt = (await tx.wait());
    console.log(receipt?.gasUsed);

    const enrollmentYear = 2;
    tx = await amContract.connect(signers.AM).createPublicIntAttribute("enrollmentYear", signers.SJ, enrollmentYear);
    await tx.wait();

    tx = await smartResource.connect(signers.RO).setPolicy(smartPolicyAddress);
    await tx.wait();

  });

  it("deve permettere l'accesso se gli attributi rispettano la policy", async function () {
    const tx = await smartResource.connect(signers.SJ).requestAccess();
    const receipt = (await tx.wait());
    console.log(receipt?.gasUsed);
    const logs = receipt?.logs;

    if (logs == undefined) {
      return;
    }
    let encryptedResult;
    for (const log of logs) {
      if (log.address == smartResourceAddress) {
        encryptedResult = log.args[0];
      }
    }
    /*
    const publicDecryptResults = await fhevm.publicDecrypt([encryptedResult]);
    const abiEncodedPolicyEvaluation = publicDecryptResults.abiEncodedClearValues;
    const decryptionProof = publicDecryptResults.decryptionProof;

    await expect(
      smartResource.connect(signers.SJ).accessResource(abiEncodedPolicyEvaluation, decryptionProof)
    ).to.not.be.reverted;*/
    
    
  }).timeout(4 * 10 ** 5);
/*
  it("deve negare l'accesso se gli attributi non rispettano la policy", async function(){

    const avgGrade = 26;
    const encryptedValue = await fhevm
      .createEncryptedInput(amContractAddress, signers.AM.address)
      .add8(avgGrade)
      .encrypt();

    const tx = await amContract
      .connect(signers.AM)
      .createPrivateAttribute("gradeAverage", signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    const tx2 = await smartResource.connect(signers.SJ).requestAccess();
    const receipt = (await tx2.wait());
    const logs = receipt?.logs;

    if (logs == undefined) {
      return;
    }
    let encryptedResult;
    for (const log of logs) {
      if (log.address == smartResourceAddress) {
        encryptedResult = log.args[0];
      }
    }

    const publicDecryptResults = await fhevm.publicDecrypt([encryptedResult]);
    const abiEncodedPolicyEvaluation = publicDecryptResults.abiEncodedClearValues;
    const decryptionProof = publicDecryptResults.decryptionProof;
    
    await expect(
      smartResource.connect(signers.SJ).accessResource(abiEncodedPolicyEvaluation, decryptionProof)
    ).to.be.revertedWith("Policy decision is not PERMIT.");
    
  });

  it("deve negare l'accesso se la decryptionProof è malformata", async function(){
    const tx = await smartResource.connect(signers.SJ).requestAccess();
    const receipt = (await tx.wait());
    const logs = receipt?.logs;

    if (logs == undefined) {
      return;
    }
    let encryptedResult;
    for (const log of logs) {
      if (log.address == smartResourceAddress) {
        encryptedResult = log.args[0];
      }
    }

    const publicDecryptResults = await fhevm.publicDecrypt([encryptedResult]);
    const abiEncodedPolicyEvaluation = publicDecryptResults.abiEncodedClearValues;
    const decryptionProof = publicDecryptResults.decryptionProof;
    const corruptedProof = (decryptionProof + "dead") as `0x${string}`;
    
    await expect(
      smartResource.connect(signers.SJ).accessResource(abiEncodedPolicyEvaluation, corruptedProof)
    ).to.be.revertedWithCustomError(
      { interface: new ethers.Interface(["error KMSInvalidSigner(address invalidSigner)"]) },
      "KMSInvalidSigner",
    );
    
  });
   
  it("deve negare l'accesso se il plaintext è un valore forgiato dal subject", async function(){

    const avgGrade = 26;
    const encryptedValue = await fhevm
      .createEncryptedInput(amContractAddress, signers.AM.address)
      .add8(avgGrade)
      .encrypt();

    const tx = await amContract
      .connect(signers.AM)
      .createPrivateAttribute("gradeAverage", signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    const tx2 = await smartResource.connect(signers.SJ).requestAccess();
    const receipt = (await tx2.wait());
    const logs = receipt?.logs;

    if (logs == undefined) {
      return;
    }
    let encryptedResult;
    for (const log of logs) {
      if (log.address == smartResourceAddress) {
        encryptedResult = log.args[0];
      }
    }

    const publicDecryptResults = await fhevm.publicDecrypt([encryptedResult]);
    const forgedABIEncodedClearValues = ethers.AbiCoder.defaultAbiCoder().encode(["bool"], [true]);
    const decryptionProof = publicDecryptResults.decryptionProof;
    
    await expect(
      smartResource.connect(signers.SJ).accessResource(forgedABIEncodedClearValues, decryptionProof)
    ).to.be.revertedWithCustomError(
      { interface: new ethers.Interface(["error KMSInvalidSigner(address invalidSigner)"]) },
      "KMSInvalidSigner",
    );
  });*/
});
