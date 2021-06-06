import { ethers, Wallet } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'
import { setSyntheticLeadingComments } from 'typescript';

// class FlashbotsOptions {
//   minTimestamp?: number
//   maxTimestamp?: number
//   revertingTxHashes?: Array<string>

//   constructor(i:number,j:number,k:Array<string>) {
//     this.minTimestamp = i;
//     this.maxTimestamp = j;
//     this.revertingTxHashes = k;
//   }
// }

const provider = new ethers.providers.JsonRpcProvider("http://localhost:9545")
const daoABI = [ "function stopService () public",
                 "function startService () public",
                 "function toggleService () public",
                 "function getService () public returns (bool)" ];
// wrap it with the mev-geth provider
const authSigner = Wallet.createRandom()
// This can be an address or an ENS name
const daoAddr = "0x4B4Cde7e6dafF488c35C6A2B32C5740D1AD223A8"
// we create a random user who will submit bundles
const user = ethers.Wallet.createRandom().connect(provider)
// faucet address
const FAUCET = '0x133be114715e5fe528a1b8adf36792160601a2d63ab59d1fd454275b31328791'
// we use the miner as a faucet for testing
const faucet = new ethers.Wallet(FAUCET, provider)
// dao contract
const dao = new ethers.Contract(daoAddr, daoABI, user)

// send 10 ether for up & down switch
; (async () => {
  // send ether to user (to turn on kill switch)
  let tx = await faucet.sendTransaction({ to: user.address,
                                  value: ethers.utils.parseEther('10')})
  await tx.wait()
  console.log("send eth to user",
              ethers.utils.formatEther(await provider.getBalance(user.address)))

  tx = await dao.functions.startService(); await tx.wait()
  console.log("start up dao")
})().catch((err) => {
  console.log(err);
})

// protector
var init = function () {
  provider.on("pending", (tx) => {
    if (tx.to == daoAddr && ethers.utils.formatEther(tx.value) == "1.0")
    {
      protector(tx)
      resetService()
    }
  })
}

var protector = function (tx: { hash: { toString: () => string } }) {
  ; (async () => {
    // console.log("stop service", tx.hash)
    const flashbotsProvider = await FlashbotsBundleProvider.create
                          (provider, authSigner, 'http://localhost:9545', 5465);
    // const options = new FlashbotsOptions (0, 0, [tx.hash.toString()])
    const nonce = await user.getTransactionCount()
    const stopService = await dao.populateTransaction.stopService()
    const startService = await dao.populateTransaction.startService()
    const toggleService = await dao.populateTransaction.toggleService()
    const blk = await provider.getBlockNumber()
    const txs = [{ signer: user, transaction: stopService  },
                 { signer: user,
                   transaction:{ to: faucet.address,
                                 value: ethers.utils.parseEther("2"),
                                 nonce: nonce + 1
                                }}]
    const targetBlks = [blk + 1, blk + 2]
    const bundlePromises = targetBlks.map(targetBlockNumber =>
                           flashbotsProvider.sendBundle(txs, targetBlockNumber))
    await Promise.all(bundlePromises)
    console.log("Evanesca!!")
  })().catch((err) => {
    console.log(err)
  })
}

var resetService = function (){
  ;(async () => {
    await new Promise(resolve => setTimeout(resolve, 10000));
    const startService = await dao.populateTransaction.startService()
    const flashbotsProvider = await FlashbotsBundleProvider.create
                            (provider, authSigner, 'http://localhost:9545', 5465);
    let blk = await provider.getBlockNumber()
    const targetBlks = [blk + 1, blk + 2]
    const txs = [{ signer: user, transaction: startService },
      { signer: user,
        transaction:{ to: faucet.address,
                      value: ethers.utils.parseEther("2")
                    }}]
    const resets = targetBlks.map(targetBlk =>
                                  flashbotsProvider.sendBundle(txs, targetBlk))
    console.log("Restart service!!")
    await Promise.all(resets)
    return
  })().catch((err) => {
    console.log(err)
  })
}

init();
