import { ethers } from 'ethers'

// connect to the simple provider
const url = 'http://localhost:8545'
const provider = new ethers.providers.JsonRpcProvider(url)
const FAUCET = '0x133be114715e5fe528a1b8adf36792160601a2d63ab59d1fd454275b31328791'
// we use the miner as a faucet for testing
const faucet = new ethers.Wallet(FAUCET, provider)

; (async () => {
  let tx = await faucet.sendTransaction({
    to: "0xBF0bd8e5a8e74bF04A929A96af6E182F4439C60d",
    value: ethers.utils.parseEther('10')
  })
  await tx.wait()
})().catch ((err) => {

})
