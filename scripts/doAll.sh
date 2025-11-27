net="localhost"

mkdir testResult
rm testResult/*
rm contracts/SmartPolicy_*
rm deploy/SmartPolicy_*
rm test/SmartResource_*
for i in $(seq 5 5 70)
do
  echo "-----------------------"

  node scripts/SmartPolicy.js --checks $i
  node scripts/SmartDeploy.js --checks $i
  node scripts/SmartTest.js --checks $i
  npx hardhat deploy --network $net
<<<<<<< HEAD
  npx hardhat test test/SmartResource_$i.ts --network $net

=======
  npx hardhat test test/SmartPolicy_$i.ts --network $net
  export ATTRIBUTES_DEPLOYED=true
>>>>>>> 0c65c2494ad131124cc72d77f36187ab4c4279e7
  rm contracts/SmartPolicy_*
  rm deploy/SmartPolicy_*
  rm test/SmartResource_$i.ts
  

  echo "-----------------------"
done

export ATTRIBUTES_DEPLOYED=false