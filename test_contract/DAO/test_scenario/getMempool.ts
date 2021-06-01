import { ethers, Wallet } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'

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
                 "function getService () public returns (bool)" ];
// wrap it with the mev-geth provider
const authSigner = Wallet.createRandom()
// This can be an address or an ENS name
const daoAddr = "0x3ebdbc4789eAfA2418C825Bad0Bac31A66C43094"
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
      protector(tx)
  })
}

var protector = function (tx: { hash: { toString: () => string } }) {
  ; (async () => {
    console.log("stop service", tx.hash)
    const flashbotsProvider = await FlashbotsBundleProvider.create
                          (provider, authSigner, 'http://localhost:9545', 5465);
    // const options = new FlashbotsOptions (0, 0, [tx.hash.toString()])
    const nonce = await user.getTransactionCount()
    const stopService = await dao.populateTransaction.stopService()
    const blk = await provider.getBlockNumber()

    const txs = [{ signer: user, transaction: stopService },
                 { signer: user,
                   transaction:{ to: faucet.address,
                                 value: ethers.utils.parseEther("5"),
                                 nonce: nonce + 1 }}]
    // tx.hash
    // 여기 options를 넣던 말던 막힌다
    let result = await flashbotsProvider.sendBundle(txs, blk + 1)
    if ('error' in result) throw new Error(result.error.message)
    await result.wait()
  })().catch((err) => {
    console.log(err)
  })
}

init();
