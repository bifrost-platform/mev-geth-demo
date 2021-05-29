import { ethers, Wallet } from 'ethers'

const FAUCET = '0x133be114715e5fe528a1b8adf36792160601a2d63ab59d1fd454275b31328791'
const DUMMY_RECEIVER = '0x1111111111111111111111111111111111111111'

// connect to the simple provider
let provider = new ethers.providers.JsonRpcProvider('http://localhost:9545')

// we use the miner as a faucet for testing
const faucet = new ethers.Wallet(FAUCET, provider)
// we create a random user who will submit bundles
const user = ethers.Wallet.createRandom().connect(provider)

;(async () => {
  // Send 1 ether to an ens name.
  const tx = await faucet.sendTransaction({
    to: DUMMY_RECEIVER,
    value: ethers.utils.parseEther("10")
  });

  await tx.wait()
  console.log('OK')

  console.log((await provider.getBalance(DUMMY_RECEIVER)).toString())
})().catch((err) => {
  console.error('error encountered in main loop', err)
  process.exit(1)
})
