import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, deployments, fhevm } from "hardhat";
import { AMContract, SmartResource, SmartPolicyExample } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { writeFileSync } from "fs";
import { sign } from "crypto";

/**
 * @dev
 * - AM: Attribute Manager
 * - RO: Resource Owner
 * - SJ: Subject
 */
type CustomSigners = {
  AM: HardhatEthersSigner;
  SJ: HardhatEthersSigner;
};

describe("AMContract", function(){
    let signers: CustomSigners;
    let amContract: AMContract;
    let amContractAddress: string;
    const to_csv_create:string[] = [];
    const to_csv_update:string[] = [];

    before(async function () {

        const Deployement = await deployments.get("AMContract");
        amContractAddress = Deployement.address;
        amContract = await ethers.getContractAt("AMContract", Deployement.address);

        const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
        signers = { AM: ethSigners[0], SJ: ethSigners[1] };
        to_csv_create.push("attributes,gas\n");
        to_csv_update.push("attributes,gas\n");
    });

    it("should create 1 attribute", async function() {
        const avgGrade = 28;
        const encryptedValue = await fhevm
            .createEncryptedInput(amContractAddress, signers.AM.address)
            .add8(avgGrade)
            .encrypt();//163812

        const tx = await amContract
            .connect(signers.AM)
            .createPrivateAttribute("gradeAverage", signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
        
        await tx.wait();

        const tx2 = await amContract.connect(signers.AM).getPrivateValue(signers.SJ, "gradeAverage");
        const receipt = await tx.wait();
        expect(receipt?.status).to.eq(1);
        /*
        const privateIntGas = (await tx.wait())?.gasUsed;
        to_csv_create.push("1,"+privateIntGas?.toString()+"\n");
        */
        
    });

    it("should create 5 attributes", async function() {
        /*const avgGrade = 28;
        const encryptedValue = await fhevm
            .createEncryptedInput(amContractAddress, signers.AM.address)
            .add8(avgGrade)
            .encrypt();*/
        let privateIntGas = 0;
        
        for(let i = 0; i<5; i++){
            const avgGrade = 28;
            const encryptedValue = await fhevm
                .createEncryptedInput(amContractAddress, signers.AM.address)
                .add8(avgGrade)
                .encrypt();

            const tx = await amContract
                .connect(signers.AM)
                .createPrivateAttribute(`gradeAverage${i}`, signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
            const gasUsed = (await tx.wait())?.gasUsed;
            console.log(gasUsed);
            privateIntGas += Number(gasUsed==undefined?Infinity:gasUsed);
        }
        to_csv_create.push("5,"+privateIntGas.toString() + "\n");
        
    }).timeout(4 * (10 ** 6));

    it("should create 100 attributes", async function() {
        this.skip();
        const avgGrade = 28;
        const encryptedValue = await fhevm
            .createEncryptedInput(amContractAddress, signers.AM.address)
            .add8(avgGrade)
            .encrypt();
        let privateIntGas = 0;
        
        for(let i = 10; i<110; i++){
            const tx = await amContract
                .connect(signers.AM)
                .createPrivateAttribute(`gradeAverage${i}`, signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
            const gasUsed = (await tx.wait())?.gasUsed;
            privateIntGas += Number(gasUsed==undefined?Infinity:gasUsed);
        }
        to_csv_create.push("100,"+privateIntGas.toString() + "\n");
        
    });

    it("should update 1 attribute", async function() {
        const avgGrade = 28;//146812
        const encryptedValue = await fhevm
            .createEncryptedInput(amContractAddress, signers.AM.address)
            .add8(avgGrade)
            .encrypt();

        const tx = await amContract
            .connect(signers.AM)
            .createPrivateAttribute("gradeAverage", signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
        const privateIntGas = (await tx.wait())?.gasUsed;
        to_csv_update.push("1,"+privateIntGas?.toString()+"\n");
        
    });

    it("should update 5 attributes", async function() {
        
        let privateIntGas = 0;
        
        for(let i = 0; i<5; i++){
            const avgGrade = 28;
            const encryptedValue = await fhevm
                .createEncryptedInput(amContractAddress, signers.AM.address)
                .add8(avgGrade)
                .encrypt();

            const tx = await amContract
                .connect(signers.AM)
                .createPrivateAttribute("gradeAverage", signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
            const gasUsed = (await tx.wait())?.gasUsed;
            console.log(gasUsed);
            privateIntGas += Number(gasUsed==undefined?Infinity:gasUsed);
        }
        to_csv_update.push("5,"+privateIntGas.toString() + "\n");
        
    }).timeout(4 * (10 ** 6));

    it("should update 100 attributes", async function() {
        this.skip();
        const avgGrade = 28;
        const encryptedValue = await fhevm
            .createEncryptedInput(amContractAddress, signers.AM.address)
            .add8(avgGrade)
            .encrypt();
        let privateIntGas = 0;
        
        for(let i = 0; i<100; i++){
            const tx = await amContract
                .connect(signers.AM)
                .createPrivateAttribute("gradeAverage", signers.SJ, encryptedValue.handles[0], encryptedValue.inputProof);
            const gasUsed = (await tx.wait())?.gasUsed;
            privateIntGas += Number(gasUsed==undefined?Infinity:gasUsed);
        }
        to_csv_update.push("100,"+privateIntGas.toString() + "\n");
        
    });




    after(function(){
        let final_to_csv = "";
        for (const t of to_csv_create){
            if(t != undefined){final_to_csv+= t}
        }
        
        writeFileSync("./testResult/AMContractCreate.csv", final_to_csv);

        final_to_csv = "";
        for (const t of to_csv_update){
            if(t != undefined){final_to_csv+= t}
        }
        writeFileSync("./testResult/AMContractUpdate.csv", final_to_csv);
    });
});