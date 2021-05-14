pragma solidity ^0.6.2;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

contract StupidTest is ERC20UpgradeSafe{
    address susd = 0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57;
    address seth = 0x94B41091eB29b36003aC1C6f0E55a5225633c884;

    event Test(
        uint256 balance
    );

    function initialize(string calldata name, string calldata symbol) public initializer{
        __ERC20_init(name, symbol);
        _mint(msg.sender, 1e20);
    }

    function testFail (address _token, uint256 _fundTokenAmount) public {
        IERC20 token = IERC20(_token);
        for (uint256 i = 0; i < 70; i++) {
            token.transfer(msg.sender, _fundTokenAmount);
        }
        emit Test(
            token.balanceOf(msg.sender)
        );
    }

    function testPass (address _token, uint256 _fundTokenAmount) public {
        IERC20 token = IERC20(_token);
        for (uint256 i = 0; i < 60; i++) {
            token.transfer(msg.sender, _fundTokenAmount);
        }
        emit Test(
            token.balanceOf(msg.sender)
        );
    }
}
