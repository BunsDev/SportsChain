# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

!!! Possible to have 2 teamID for the same token address 
Règler le problème de UNPREDICTABLE_GAS_LIMIT chainlink qui peut être lié à l'erreur de source (erreur soit de gas soit erreur d'execution)
Règler le problème de source : string du fichier js trop long en passant en argument sur remix : mettre le fichier js dans un gist