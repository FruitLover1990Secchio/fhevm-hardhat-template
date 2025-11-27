import { argv } from "node:process";
import { writeFileSync } from "node:fs";

const flag = argv[2];
let value_checks;
if (flag == undefined) {
  throw new Error(
    "Need to specify the number of value checks.\nUse node scripts/SmartTest.js --checks [value]\nMin 5 max 70, multiple of 5",
  );
} else if (flag == "--checks") {
  value_checks = parseInt(argv[3]);
  if (isNaN(value_checks)) throw new Error("Number of value checks not recognized");
  if (value_checks % 5 != 0 || value_checks == 0) throw new Error("Number must be multiple of 5");
} else {
  throw new Error("Command line argument not recognized");
}

//create test
const ratio = 5;
let i_vector = [];
for (let i = 0; i <= ratio; i++) {
  i_vector.unshift((ratio - i) * (value_checks / ratio));
}
let base = `
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments} from "hardhat";
import { SmartResource, SmartPolicy_${value_checks}_${i_vector[0]},SmartPolicy_${value_checks}_${i_vector[1]},SmartPolicy_${value_checks}_${i_vector[2]},SmartPolicy_${value_checks}_${i_vector[3]},SmartPolicy_${value_checks}_${i_vector[4]},SmartPolicy_${value_checks}_${i_vector[5]}, AMContract} from "../types";
import { expect } from "chai";
import { writeFileSync } from "node:fs";

import { FhevmType } from "@fhevm/hardhat-plugin";

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

describe("SmartResource_${value_checks}", function () {
  let signers: CustomSigners;
  let smartResource: SmartResource;
  let smartResourceAddress: string;
  let amContract: AMContract;
  let amContractAddress: string;
  const gasUsed: { [key: number]: bigint | undefined } = {};
  let smartPolicyAddress${i_vector[0]}: string;
  let smartPolicyAddress${i_vector[1]}: string;
  let smartPolicyAddress${i_vector[2]}: string;
  let smartPolicyAddress${i_vector[3]}: string;
  let smartPolicyAddress${i_vector[4]}: string;
  let smartPolicyAddress${i_vector[5]}: string;

  before(async function () {

    try {

      let Deployement = await deployments.get("SmartPolicy_${value_checks}_${i_vector[0]}");
      smartPolicyAddress${i_vector[0]} = Deployement.address;

      Deployement = await deployments.get("SmartPolicy_${value_checks}_${i_vector[1]}");
      smartPolicyAddress${i_vector[1]} = Deployement.address;

      Deployement = await deployments.get("SmartPolicy_${value_checks}_${i_vector[2]}");
      smartPolicyAddress${i_vector[2]} = Deployement.address;

      Deployement = await deployments.get("SmartPolicy_${value_checks}_${i_vector[3]}");
      smartPolicyAddress${i_vector[3]} = Deployement.address;

      Deployement = await deployments.get("SmartPolicy_${value_checks}_${i_vector[4]}");
      smartPolicyAddress${i_vector[4]} = Deployement.address;

      Deployement = await deployments.get("SmartPolicy_${value_checks}_${i_vector[5]}");
      smartPolicyAddress${i_vector[5]} = Deployement.address;

      Deployement = await deployments.get("AMContract");
      amContractAddress = Deployement.address;
      amContract = await ethers.getContractAt("AMContract", Deployement.address);

      Deployement = await deployments.get("SmartResource");
      smartResourceAddress = Deployement.address;
      smartResource = await ethers.getContractAt("SmartResource", Deployement.address);

    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network localhost'";
      throw e;
    }

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
  }).timeout(4 * 10 ** 5);
`;
for (const priv of i_vector) {
  base += `
  it("Test policy with ${priv} private attributes", async function () {
    let tx = await smartResource.connect(signers.RO).setPolicy(smartPolicyAddress${priv});
    await tx.wait();

    tx = await smartResource.connect(signers.SJ).requestAccess();
    const receipt = await tx.wait();
    gasUsed[${priv}] = receipt?.gasUsed;
    /*
    const logs = (receipt)?.logs;
    
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
    
    const tx2 = await smartResource.connect(signers.SJ).accessResource(abiEncodedPolicyEvaluation, decryptionProof);
    await tx2.wait();
    // transaction will revert if decision != PERMIT
    */
    
  }).timeout(4 * 10**5);
`;
}

base += `

  after(function () {
    let evaluationGas = "privateAttributes,gas used\\n";
    for(const key in gasUsed) {
      evaluationGas += key.toString() + "," + (gasUsed[key]==undefined?"undefined":gasUsed[key]?.toString()) + "\\n";
    }
    writeFileSync("./testResult/SmartPolicy_${value_checks}.csv", evaluationGas);    
  });

});
`;

writeFileSync(`./test/SmartResource_${value_checks}.ts`, base);
