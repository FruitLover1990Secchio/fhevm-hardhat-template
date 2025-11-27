import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const deployer = await hre.getUnnamedAccounts();
  const { deploy } = hre.deployments;

  const deployedAM = await deploy("SmartResource", {
    from: deployer[0],
    log: true,
  });

  console.log(`Deployed by : ${deployer[0]} at ${deployedAM.address}`);
};
export default func;
func.id = "deploy_SmartResource"; // id required to prevent reexecution
func.tags = ["SmartResource"];