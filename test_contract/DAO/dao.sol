// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

contract dao {
  uint constant public WITHDRAWAL_LIMIT = 1 ether;
  bool stopSig = false;
  mapping (address => uint) public lastWithdrawTime;
  mapping (address => uint) public balances;

  function stopService () public {
    stopSig = true;
  }

  fallback () external payable { return; }

  function deposit() public payable {
    balances[msg.sender] += msg.value;
  }

  function withdraw(uint _amount) public {
    require(stopSig != true);
    require(balances[msg.sender] >= _amount);
    require(_amount <= WITHDRAWAL_LIMIT);
    require(block.timestamp >= lastWithdrawTime[msg.sender] + 1 weeks);

    (bool sent, ) = msg.sender.call{value: _amount}("");
    require (sent, "Failed to send Ether");

    balances[msg.sender] -= _amount;
    lastWithdrawTime[msg.sender] = block.timestamp;
  }

  function getBalance() public view returns (uint) {
    return address(this).balance;
  }
}
