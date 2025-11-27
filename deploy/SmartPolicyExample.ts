import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployments } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const deployer = await hre.getUnnamedAccounts();
  const { deploy } = hre.deployments;

  const amAddress = (await deployments.get("AMContract")).address;

  const deployedAM = await deploy("SmartPolicyExample", {
    args: [amAddress],
    from: deployer[0],
    log: true,
  });

  console.log(`Deployed by : ${deployer[0]} at ${deployedAM.address}`);
};
export default func;
func.id = "deploy_SmartPolicyExample"; // id required to prevent reexecution
func.tags = ["SmartPolicyExample"];
