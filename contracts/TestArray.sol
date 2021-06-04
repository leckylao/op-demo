pragma solidity 0.6.12;
// pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "./interfaces/ITestArray.sol";

contract TestArray is ITestArray{
  uint8[] public tests = [1,2,3,4,5];
  address[] public testAddresses;
  Asset[] public assets;
  int public override bob;

  string public message = "require at least one deposit asset";

  function get() public override view returns (uint8[] memory) {
    return tests;
  }

  function getAddresses() public override view returns (address[] memory) {
    return testAddresses;
  }

  function getAssets() public override view returns(Asset[] memory){
    return assets;
  }

  function setAssets(Asset memory asset) public {
    assets.push(asset);
  }
}
