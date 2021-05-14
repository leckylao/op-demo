pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

contract StupidToken is ERC20UpgradeSafe{

    event Test(
        uint256 balance
    );

    function initialize(string calldata name, string calldata symbol) public initializer{
        __ERC20_init(name, symbol);
        _mint(msg.sender, 100e18);
    }
    // constructor() ERC20("TestToken", "TT") public {
    //     _mint(0xceF7ADD9d395896Bea90fd7c3f109b88F61329F2, 100e18);
    // }
}
