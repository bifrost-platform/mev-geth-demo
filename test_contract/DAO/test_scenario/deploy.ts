import { ethers, ContractFactory } from 'ethers'
// @ts-ignoreg
import solc from 'solc'

var fs = require('fs');
var data = fs.readFileSync('/home/jeongmin/Documents/' +
                           'mev-geth-demo/test_contract/DAO/dao.sol','utf8');
const INPUT =
  { language: 'Solidity',
    sources: { 'dao.sol': { content: data }},
    settings: { outputSelection: { '*': { '*': ['*'] }}}
  }
const OUTPUT = JSON.parse(solc.compile(JSON.stringify(INPUT)))
const COMPILED = OUTPUT.contracts['dao.sol']
const ABI = COMPILED.dao.abi
const BIN = '0x' + COMPILED.dao.evm.bytecode.object
const DUMMY_RECEIVER = '0x1111111111111111111111111111111111111111'

// connect to the simple provider
const url = 'http://localhost:8545'
const provider = new ethers.providers.JsonRpcProvider(url)
const FAUCET = '0x133be114715e5fe528a1b8adf367921606' +
               '01a2d63ab59d1fd454275b31328791'
// we use the miner as a faucet for testing
const faucet = new ethers.Wallet(FAUCET, provider)
// we create a random user who will submit bundles
const user = ethers.Wallet.createRandom().connect(provider)

;(async () => {
  // fund the user with some Ether from the coinbase address
  console.log('Funding account...')
  ;(await faucet.sendTransaction({ to: user.address,
                                   value:ethers.utils.parseEther('50')})).wait()

  // deploy the bribe contract
  console.log('Deploying dao contract...')
  const factory = new ContractFactory(ABI, BIN, user)
  const contract = await factory.deploy()
  await contract.deployTransaction.wait()
  console.log('Deployed at:', contract.address)

  console.log('Funding dao contract...')
  ;(await faucet.sendTransaction({ to: contract.address,
                                  value: ethers.utils.parseEther('30')})).wait()

  let dummyBal = await provider.getBalance(DUMMY_RECEIVER)
  console.log('Dummy bal', ethers.utils.formatEther(dummyBal))

  let userBal = await provider.getBalance(user.address)
  console.log('user bal', ethers.utils.formatEther(userBal))

  let daoBal = await provider.getBalance(contract.address)
  console.log('dao bal', ethers.utils.formatEther(daoBal))

})().catch((err) => {
  console.error('error encountered in main loop', err)
  process.exit(1)
})
