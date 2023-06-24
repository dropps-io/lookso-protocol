// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { ERC165Checker } from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import { IERC725Y } from "@erc725/smart-contracts/contracts/interfaces/IERC725Y.sol";

/**
* @title LSP19 post validator
* @notice A validator tailored for Universal Profiles and content publishing
* @dev Writes to the Universal Profile key/value store
*/
contract LSP19PostValidator is Context {

    bytes32 public constant REGISTRY_KEY = keccak256("LSP19SocialRegistry");

    event NewPost(bytes32 indexed postHash, string indexed postUrl, address indexed author);

    /**
    * @notice Universal Profile (message sender) makes a post
    * @param postHash will pushed in an event, with the _msgSender, in order to validate the author and the timestamp of the post
    * @param postUrl will pushed in an event, with the _msgSender, in order to validate the author and the timestamp of the post
    */
    function post(bytes32 postHash, string calldata postUrl) public {
        // Save the timestamp as a blockchain event
        emit NewPost(postHash, postUrl, _msgSender());
    }

    /**
    * @notice Universal Profile (message sender) makes a post
    * @dev This contract must have permissions to write on the Universal Profile
    * @param postHash will pushed in an event, with the _msgSender, in order to validate the author and the timestamp of the post
    * @param postUrl will pushed in an event, with the _msgSender, in order to validate the author and the timestamp of the post
    * @param registryJsonUrl Reference to the latest Social Media Record of the sender
    */
    function postWithJsonUrl(bytes32 postHash, string calldata postUrl, bytes calldata registryJsonUrl) public {

        // Save the timestamp as a blockchain event
        post(postHash, postUrl);

        // Send the setData tx to the UP
        IERC725Y(_msgSender()).setData(REGISTRY_KEY, registryJsonUrl);
    }
}