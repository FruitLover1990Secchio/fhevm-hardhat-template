$net = "localhost"

New-Item -ItemType Directory -Force -Path testResult

Remove-Item -Path "testResult\Smart*" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "contracts\SmartPolicy_*" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "deploy\SmartPolicy_*" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "test\SmartPolicy_*" -Force -ErrorAction SilentlyContinue


for ($i = 5; $i -le 70; $i += 5) {
    Write-Host "-----------------------"

    node .\scripts\SmartPolicy.js --checks $i
    node .\scripts\SmartDeploy.js --checks $i
    node .\scripts\SmartTest.js --checks $i

    Write-Host "-----------------------"
    npx hardhat deploy --network $net
    npx hardhat test "test\SmartResource_$i.ts" --network $net

    Remove-Item -Path "contracts\SmartPolicy_*" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "deploy\SmartPolicy_*" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "test\SmartResource_$i.ts" -Force -ErrorAction SilentlyContinue

    Write-Host "-----------------------"
}
