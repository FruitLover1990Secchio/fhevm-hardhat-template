$net = "localhost"
$param = $args[0]

New-Item -ItemType Directory -Force -Path testResult

Write-Host "-----------------------"

node .\scripts\SmartPolicy.js --checks $param
node .\scripts\SmartDeploy.js --checks $param
node .\scripts\SmartTest.js --checks $param

Write-Host "-----------------------"
npx hardhat deploy --network $net
npx hardhat test "test\SmartResource_$param.ts" --network $net
Write-Host "-----------------------"