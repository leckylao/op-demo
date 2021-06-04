pragma solidity 0.6.12;
// pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

interface ITestArray {
  struct Asset {
    address asset;
    bool isDeposit;
  }

  function bob() external returns (int);

  function get() external view returns (uint8[] memory);

  function getAddresses() external view returns (address[] memory);

  function getAssets() external view returns(Asset[] memory);
}

