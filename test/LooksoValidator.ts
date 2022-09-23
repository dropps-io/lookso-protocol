import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "ethers";
import { Contract } from "@ethersproject/contracts/src.ts/index";

import { ERC725, ERC725JSONSchema} from '@erc725/erc725.js';

import KeyManager from '@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json';
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { setPermissions } from "./utils/setPermissions";
import { LooksoPostValidator, LooksoPostValidator__factory } from "../typechain-types";
import { Provider } from "@ethersproject/abstract-provider";
import { callPost } from "./utils/callPost";

require('dotenv').config();

describe("LooksoValidator", function () {
  this.timeout(100000) // increase timeout to wait for Blockchain confirmations
  let looksoPostValidator: LooksoPostValidator;
  let keyManager: any;
  let luksoProvider: Provider;
  let tx:any;
  let up:any;
  const postHash = "0xebd6f888b589f38ab6d5d1da951dcb2c8146ae589ab46d452a4a986e524c0512";
  const jsonUrl = "0xaa0b2cdbb4ac4db5cc71238d6f3f77edc521b0106152b420f4dd1d39b145b12a";

  before(async function() {
    // Get the provider
    luksoProvider = ethers.getDefaultProvider("https://rpc.l16.lukso.network");
    // Get an address with LYXt that has permissions on a UP
    const wallet = new ethers.Wallet(process.env.L16PRIVATEKEY as string, luksoProvider)
    // Instantiate an UP
    up = new ethers.Contract(process.env.UPADDRESS as string, UniversalProfile.abi, wallet);

    // Deploy the Validator Timestamper Contract
    const LooksoPostValidator = await ethers.getContractFactory("LooksoPostValidator");
    looksoPostValidator = await LooksoPostValidator.deploy();
    console.log("validator address: "+looksoPostValidator.address)
    // Grant the Validator access to the UP

    const erc725 = new ERC725(LSP6Schema as ERC725JSONSchema[], process.env.UPADDRESS, luksoProvider);
      // Instantiate the UP's KeyManager
    keyManager = new ethers.Contract( (await up.owner()), KeyManager.abi, wallet);
      // Send a blockchain transaction giving permissions to the Validator
    await setPermissions(up, keyManager, erc725, looksoPostValidator.address);
    console.log("Validator permissions granted on "+looksoPostValidator.address)

  })

    it("Stores the validation and saves the post on the UP", async function() {
      tx = await callPost(postHash, jsonUrl, looksoPostValidator, keyManager); 
    })

    it("Retrieves the correct timestamp of a post", async function() {
      const txTimestamp = ( (await luksoProvider.getBlock(tx.blockNumber)).timestamp );
      const validatorTimestamp = (parseInt (await (looksoPostValidator["getTimestamp"](postHash))));
      expect(validatorTimestamp).to.equal(txTimestamp);
    })

    it("Retrieves the correct author of a post", async function() {
      console.log(await looksoPostValidator["getData(bytes32)"](postHash))
      expect(await (looksoPostValidator.getSender(postHash))).to.equal(up.address)
    })

    it("Reverts when saving the same post hash twice", async function() {
      await expect(callPost(postHash, jsonUrl, looksoPostValidator, keyManager)).to.be.reverted;
    })


})