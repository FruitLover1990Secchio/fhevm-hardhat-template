import { writeFileSync } from "node:fs";
import { argv } from "node:process";



/**
 * @dev Helper class for building policies with custom value checks on private attributes.
 */
class PolicyBuilder{

  constructor(v){
    this.value_checks = v;
    if (isNaN(this.value_checks)) throw new Error("Number of value checks not recognized");
    if (this.value_checks % 5 != 0 || this.value_checks == 0) throw new Error("Number must be multiple of 5");
    this.ratio = 5;
  }

  _build_constructor(total_private_functions){
    let declarations = "";
    let constructor = `constructor(address addr) {
      owner = msg.sender;
      am_contract = addr;

      `;

    for (let k = 1; k<= total_private_functions; k++){
      declarations += `uint8 public immutable grade_threshold_${k} = 27;\n    `;
    }

    return declarations + constructor + "}";
  }

  _build_evaluate_target(){
    return `
    function evaluateTarget(address _subject) internal view returns (bool) {
        string memory _role = IAM(am_contract).getPublicStringValue(_subject, "subjectRole");
        return keccak256(abi.encode(_role)) == keccak256(abi.encode("bachelor student"));
    }
`;
  }

  _build_gradeAverage(total_private_functions){
    let result = "";
    for (let k = 1; k <= total_private_functions; k++){
      result += `
    function evaluateCondition_prize_gradeAverage${k}(address _subject) internal returns (ebool) {
        euint8 _inputs = IAM(am_contract).getPrivateValue(_subject, "gradeAverage");

        return FHE.gt(_inputs, grade_threshold_${k});
    }`;
    }
    return result;
  }

  _build_enrollmentYear(total_private_functions){
    let result = "";
    for(let k = total_private_functions+1; k<= this.value_checks; k++){
      result += `
    function evaluateCondition_prize_enrollmentYear${k}(address _subject) internal view returns (bool) {
        int _year = IAM(am_contract).getPublicIntValue(_subject, "enrollmentYear");
        return _year >= year_threshold;
    }
      `
    }
    return result;
  }

  _build_evaluate_rulePrize(total_private_functions){
    let private_invocations = "";
    let public_invocations = "";
    for(let k = 1; k<= total_private_functions; k++){
      if(k == 1){
        private_invocations+= "res.evalResult = evaluateCondition_prize_gradeAverage1(_subject);\n        "
      }
      private_invocations += `res.evalResult = FHE.and(res.evalResult, evaluateCondition_prize_gradeAverage${k}(_subject));\n        `;
    }

    
    // do it only if we are not in the case with all private attributes
    if (total_private_functions != this.value_checks) {
      public_invocations += "FHE.asEbool("

      for (let k = total_private_functions+1; k<= this.value_checks; k++){
        public_invocations += `evaluateCondition_prize_enrollmentYear${k}(_subject) `;
        if (k != this.value_checks) public_invocations += "&& "; 
      }
      public_invocations += ")"
    }

    let final_invocations = "";
    // only public 
    if(total_private_functions == 0){
      final_invocations = `res.evalResult = ${public_invocations};`;
    }else if (total_private_functions == this.value_checks){//only private attributes
      final_invocations = private_invocations;
    }else {//both attributes
      final_invocations += `${private_invocations}res.evalResult = FHE.and(
          res.evalResult,
          ${public_invocations}
        );`
    }

    return `
    function evaluateRule_prize(address _subject) internal returns (RuleResult memory) {
        RuleResult memory res;
        ${final_invocations}
        res.effect = RuleEffect.PERMIT;
        return res;
    }
    `
    
  }

  _build_combining_algorithm(){
    return `
    function combining_algorithm(RuleResult memory rule1) internal returns (euint8) {
        //ALGORITHM: FIRST APPLICABLE
        //urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:first-applicable

        return
            FHE.select(
                rule1.evalResult,
                FHE.asEuint8(uint8(rule1.effect)),
                FHE.asEuint8(uint8(RuleEffect.NOTAPPLICABLE))
            );
    }
    `
  }

  _build_evaluate_function(){
    return `
    function evaluatePolicy(address _subject) external returns (euint8) {
        euint8 evaluationResult;
        if (!evaluateTarget(_subject)) {
            evaluationResult = FHE.asEuint8(uint8(RuleEffect.NOTAPPLICABLE));
        } else {
            evaluationResult = combining_algorithm(evaluateRule_prize(_subject));
        }

        FHE.allow(evaluationResult, msg.sender);
        return evaluationResult;
    }
    `
  }
  
  /**
   * @dev Build the policy files.
   */
  build_policy(){
    for (let i = 0; i<= this.ratio; i++)
    {
      const total_private_functions = (this.ratio - i) * (this.value_checks / this.ratio);
      const policy = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IAM {
    function getPrivateValue(address subject, string memory attribute) external returns (euint8);

    function getPublicStringValue(address subject, string memory attribute) external view returns (string memory);

    function getPublicIntValue(address subject, string memory attribute) external view returns (int);
}

contract SmartPolicy_${this.value_checks}_${total_private_functions} is ZamaEthereumConfig {
    enum RuleEffect {
        PERMIT,
        DENY,
        NOTAPPLICABLE,
        INDETERMINATE
    }

    struct RuleResult {
        ebool evalResult;
        RuleEffect effect;
    }

    address public immutable owner;
    address public immutable am_contract;
    int8 public immutable year_threshold = 2;
    ${this._build_constructor(total_private_functions)}
    ${this._build_evaluate_target()}
    ${this._build_gradeAverage(total_private_functions)}
    ${this._build_enrollmentYear(total_private_functions)}
    ${this._build_evaluate_rulePrize(total_private_functions)}
    ${this._build_combining_algorithm()}
    ${this._build_evaluate_function()}
}
`;
      writeFileSync(`./contracts/SmartPolicy_${this.value_checks}_${total_private_functions}.sol`, policy);
    }
  }
}

const flag = argv[2];
let builder;
if (flag == undefined) {
  throw new Error(
    "Need to specify the number of value checks.\nUse node scripts/SmartPolicy.js --checks [value]\nMin 5 max 70, multiple of 5",
  );
} else if (flag == "--checks") {
  builder = new PolicyBuilder(parseInt(argv[3]));
} else {
  throw new Error("Command line argument not recognized");
}

builder.build_policy();
