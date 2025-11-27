# XACML privacy-preserving system

# What is this?

This repository is part of my thesis and it aims to show a proof-of-concept of an ABAC system on the Sepolia testnet
leveraging homorphic encryption. The encryption is achieved via the fhevm library published by ZAMA.

# How to use

This repository offers the AMContract.sol and some scripts to write, deploy and test the Smart Policies.

1. **Install dependencies**

```bash
  npm install
```

2. **Build the necessary files**

```bash
   node scripts/SmartPolicy.js --checks 5
   node scripts/SmartDeploy.js --checks 5
   node script/SmartTest.js --checks 5
```

3. **Deploy and run**

An hardhat node should be up and running.

```
   npx hardhat deploy
   npx hardhat test
```

4. **Do it all together**

```bash
   bash scripts/doOnce.sh 5
```

or

```bash
   bash scripts/doAll.sh
```

# Notes on usage

1. The number given to the scripts is the number of value-checks (predicates) of the newly created smart policies. It
   should be a multiple of 5. Each time it will create 6 policies, with different ratioes between private attributes and
   public attributes, as an example a call with value 50 will create 6 contracts with 0, 10, 20, 30, 40, 50 private
   attribute checks.

2. The bash script doOnce.sh will automate the procedure for a given value. The script doAll.sh will automate it for all
   multiple of 5 between 5 and 70.

3. Each test execution will update the results stored in the testResult directory.

4. SmartTestTime.js is a script that creates where the actual decryption is awaited. I divided it to save time when
   testing for the gas usage only.

5. The test files works fine with either localhost and sepolia.

# Notes on the project

TODO: Just to be on pair with the logic proposed in the thesis, I need a third account to use it for the deployment of
the contract (the AM Manager). Will fix soon.