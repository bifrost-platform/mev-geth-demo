import { Contract, ethers, Wallet } from 'ethers'
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle'


class FlashbotsOptions {
  minTimestamp?: number
  maxTimestamp?: number
  revertingTxHashes?: Array<string>

  constructor(i:number,j:number,k:Array<string>) {
    this.minTimestamp = i;
    this.maxTimestamp = j;
    this.revertingTxHashes = k;
  }
}

const provider = new ethers.providers.JsonRpcProvider("http://localhost:9545")
const DAOABI = [ "function stopService () public",
                  "function startService () public",
                "function getService () public returns (bool)"
              ];
// wrap it with the mev-geth provider
const authSigner = Wallet.createRandom()
// This can be an address or an ENS name
const daoAddr = "0x892e0095DE72688Eb2Ef88001EBC2B33aFD4ca8A"
// we create a random user who will submit bundles
const user = ethers.Wallet.createRandom().connect(provider)

const FAUCET = '0x133be114715e5fe528a1b8adf36792160601a2d63ab59d1fd454275b31328791'
// we use the miner as a faucet for testing
const faucet = new ethers.Wallet(FAUCET, provider)

// Read-Write; By connecting to a Signer, allows:
// - Everything from Read-Only (except as Signer, not anonymous)
// - Sending transactions for non-constant functions
const dao = new ethers.Contract(daoAddr, DAOABI, user)

; (async () => {
  // send ether to user (to turn on kill switch)
  let tx = await faucet.sendTransaction({
    to: user.address,
    value: ethers.utils.parseEther('10')
  })
  await tx.wait()
  console.log("send eth to user", ethers.utils.formatEther(await provider.getBalance(user.address)))

  let a = await dao.functions.startService()
  await a.wait()

})().catch((err) => {
  console.log(err);
})

// protector
var init = function () {
  provider.on("pending", (tx) => {
    if (tx.to == daoAddr && ethers.utils.formatEther(tx.value) == "1.0")
    {
      // protect the tx
      ; (async () => {
        console.log("stop service", tx.hash)
        const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner, 'http://localhost:9545', 5465);
        const options = new FlashbotsOptions (0, 0, [tx.hash.toString()])
        const nonce = await user.getTransactionCount()
        const stopService = await dao.populateTransaction.stopService()
        const txs = [{
            signer: user,
            transaction: stopService
          },
          {
            signer: user,
            transaction: {
              to: faucet.address,
              value: ethers.utils.parseEther("5"),
              nonce: nonce + 1
            }
          }]
        const blk = await provider.getBlockNumber()
        //tx.hash
        const result = await flashbotsProvider.sendBundle(txs, blk + 1) // 여기 options를 넣던 말던 막힌다

        if ('error' in result) {
          throw new Error(result.error.message)
        }

        await result.wait()
        const receipts = await result.receipts()
        console.log(receipts)

      })().catch((err) => {
        console.log(err)
      })
    }
  })
}

init();
