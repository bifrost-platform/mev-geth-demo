import { ethers } from 'ethers'

// connect to the simple provider
const url = 'http://localhost:8545'
const provider = new ethers.providers.JsonRpcProvider(url)
const FAUCET = '0x133be114715e5fe528a1b8adf36792160601a2d63ab59d1fd454275b31328791'
// we use the miner as a faucet for testing
const faucet = new ethers.Wallet(FAUCET, provider)
const daoAddr = "0x1AC58C476244096C125fcf87A992f6C5B85a0b40"

; (async () => {
  let tx = await faucet.sendTransaction({
    to: daoAddr, // dao Contract
    value: ethers.utils.parseEther('1')
  })
  await tx.wait()
  console.log (ethers.utils.formatEther(await provider.getBalance(daoAddr)))

})().catch ((err) => {
  console.error('error encountered in main loop', err)
  process.exit(1)
})
