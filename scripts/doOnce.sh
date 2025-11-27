net="localhost"

mkdir testResult
echo "-----------------------"
node scripts/SmartPolicy.js --checks $1
node scripts/SmartDeploy.js --checks $1
node scripts/SmartTest.js --checks $1
npx hardhat deploy --network $net
npx hardhat test test/SmartResource_$1.ts --network $net

echo "-----------------------"