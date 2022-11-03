import { expect } from "chai";
import { ethers } from "hardhat";

import { ERC725, ERC725JSONSchema} from '@erc725/erc725.js';

import KeyManager from '@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json';
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { setPermissions } from "./utils/setPermissions";
import { LooksoPostValidator as ValidatorType, LooksoPostValidator__factory } from "../typechain-types";
import { Provider } from "@ethersproject/abstract-provider";
import { JsonRpcProvider } from "@ethersproject/providers";
import { callPost } from "./utils/callPost";
import { deployUP } from "./utils/deployUP";
import LooksoPostValidator from "../artifacts/contracts/LooksoPostValidator.sol/LooksoPostValidator.json"

require('dotenv').config();

describe("LooksoPostValidator", function() {
  this.timeout(100000) // increase timeout to wait for Blockchain confirmations
  let looksoPostValidator: ValidatorType;
  let keyManager: any;
  let tx:any;
  let up:any;
  const postHash = "0xebd6f888b589f38ab6d5d1da951dcb2c8146ae589ab46d452a4a986e524c0512";
  const jsonUrl = "0xaa0b2cdbb4ac4db5cc71238d6f3f77edc521b0106152b420f4dd1d39b145b12a";

  describe("Hardhat Network", function() {

    let hardhatProvider: Provider;
    let validatorEventTopic: string[];

    before(async function() {
      // Get Provider
      hardhatProvider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
      const wallet = new ethers.Wallet(process.env.L16PRIVATEKEY as string, hardhatProvider);

      // Deploy an UP
      let [upAddress, keyManagerAddress] = await deployUP(hardhatProvider as JsonRpcProvider);
      up = new ethers.Contract(upAddress as string, UniversalProfile.abi, wallet);
      keyManager = new ethers.Contract( (await up.owner()), KeyManager.abi, wallet);

      // Deploy the Validator Timestamper Contract
      const ValidatorFactory =  new ethers.ContractFactory(LooksoPostValidator.abi, LooksoPostValidator.bytecode, wallet);
      looksoPostValidator = (await ValidatorFactory.deploy()) as ValidatorType;
      // Grant the Validator access to the UP
  
      const erc725 = new ERC725(LSP6Schema as ERC725JSONSchema[], up.address, hardhatProvider);

        // Send a blockchain transaction giving permissions to the Validator
      await setPermissions(up, keyManager, erc725, looksoPostValidator.address);

    })

    it("Saves the post on the UP with the correct json url", async function() {
      tx = await callPost(postHash, jsonUrl, looksoPostValidator, keyManager); 
    })

    it("Emits event 'newPost(bytes32 indexed postHash, address indexed author)' after a post is saved in the UP", async function() {
      const receipt = await tx.wait();
      const validatorEvents = (receipt.logs.filter(log => log.address == looksoPostValidator.address))
      expect(validatorEvents.length).to.equal(1);
      expect(validatorEvents[0].topics[0]).to.equal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("newPost(bytes32,address)")));
      validatorEventTopic = validatorEvents[0].topics;
      // const txTimestamp = ( (await hardhatProvider.getBlock(tx.blockNumber)).timestamp );
      // const validatorTimestamp = (parseInt (await (looksoPostValidator["getTimestamp"](postHash))));
      // expect(validatorTimestamp).to.equal(txTimestamp);
    })

    it("Emits the event with the correct author", async function() {
      // Position 0 is the hash of the eventName, 1 is the postHash and 2 is the author
      const author = validatorEventTopic[2];
      const authorAddress = "0x"+author.slice(26);
      // ethers.utils.getAddress(address) returns the checksum format of an address
      expect(ethers.utils.getAddress(authorAddress)).to.equal(up.address);
    })

    it("Emits the event with the correct postHash", async function() {
      // Position 0 is the hash of the eventName, 1 is the postHash and 2 is the author
      const _postHash = validatorEventTopic[1];
      expect(_postHash).to.equal(postHash);
    })

    it("Emits event regardless of having emitted for that postHash before", async function() {
      await expect(callPost(postHash, jsonUrl, looksoPostValidator, keyManager)).not.to.be.reverted;
    })


  })
  
  describe("L16 Network", function () {

    this.timeout(100000) // increase timeout to wait for Blockchain confirmations
    let looksoPostValidator: ValidatorType;
    let keyManager: any;
    let luksoProvider: Provider;
    let tx:any;
    let up:any;
    const postHash = "0xebd6f888b589f38ab6d5d1da951dcb2c8146ae589ab46d452a4a986e524c0512";
    const jsonUrl = "0xaa0b2cdbb4ac4db5cc71238d6f3f77edc521b0106152b420f4dd1d39b145b12a";
    let validatorEventTopic: string[];
    
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
    console.log(looksoPostValidator.address)
    // Grant the Validator access to the UP

    const erc725 = new ERC725(LSP6Schema as ERC725JSONSchema[], process.env.UPADDRESS, luksoProvider);
      // Instantiate the UP's KeyManager
    keyManager = new ethers.Contract( (await up.owner()), KeyManager.abi, wallet);
      // Send a blockchain transaction giving permissions to the Validator
    await setPermissions(up, keyManager, erc725, looksoPostValidator.address);

  })

    it("Saves the post on the UP with the correct json url", async function() {
      tx = callPost(postHash, jsonUrl, looksoPostValidator, keyManager); 
      await expect(tx).not.to.be.reverted;
    })

    it("Emits event 'newPost(bytes32 indexed postHash, address indexed author)' after a post is saved in the UP", async function() {
      const receipt = await tx;
      const validatorEvents = (receipt.logs.filter(log => log.address == looksoPostValidator.address))
      expect(validatorEvents.length).to.equal(1);
      expect(validatorEvents[0].topics[0]).to.equal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("newPost(bytes32,address)")));
      validatorEventTopic = validatorEvents[0].topics;
      // const txTimestamp = ( (await hardhatProvider.getBlock(tx.blockNumber)).timestamp );
      // const validatorTimestamp = (parseInt (await (looksoPostValidator["getTimestamp"](postHash))));
      // expect(validatorTimestamp).to.equal(txTimestamp);
    })

    it("Emits the event with the correct author", async function() {
      // Position 0 is the hash of the eventName, 1 is the postHash and 2 is the author
      const author = validatorEventTopic[2];
      const authorAddress = "0x"+author.slice(26);
      // ethers.utils.getAddress(address) returns the checksum format of an address
      expect(ethers.utils.getAddress(authorAddress)).to.equal(up.address);
    })

    it("Emits the event with the correct postHash", async function() {
      // Position 0 is the hash of the eventName, 1 is the postHash and 2 is the author
      const _postHash = validatorEventTopic[1];
      expect(_postHash).to.equal(postHash);
    })

    it("Emits event regardless of having emitted for that postHash before", async function() {
      await expect(callPost(postHash, jsonUrl, looksoPostValidator, keyManager)).not.to.be.reverted;
    })
  })
})

