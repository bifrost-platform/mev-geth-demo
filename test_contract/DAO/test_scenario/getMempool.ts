import { ethers } from 'ethers'

// connect to the simple provider
const url = 'http://localhost:8545'
const provider = new ethers.providers.JsonRpcProvider(url)

// protector
var init = function () {
  provider.on("pending", (tx) => {
    let targetEth = ethers.utils.formatEther(tx.value);
    console.log("target value: " + targetEth);
  })
}

init();
