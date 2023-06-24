import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-waffle";
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-contract-sizer';


const dotenv = require("dotenv")
dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500
      }
    }
  },
  etherscan: {
    apiKey: 'no-api-key-needed',
    customChains: [
      {
        network: 'testnet',
        chainId: 4201,
        urls: {
          apiURL: 'https://explorer.execution.testnet.lukso.network/api',
          browserURL: 'https://explorer.execution.testnet.lukso.network/',
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
      loggingEnabled: true,
      accounts: [{
        privateKey: process.env.PRIVATEKEY || '',
        balance: "100000000000000000000" //100ETH
      }]
    },
    L16: {
      url: "https://rpc.l16.lukso.network",
      accounts: [process.env.PRIVATEKEY || '']
    },
    testnet: {
      url: "https://rpc.testnet.lukso.network",
      accounts: [process.env.PRIVATEKEY || '']
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: [process.env.PRIVATEKEY || '']
    }
  },
  defaultNetwork: "L16",
};

export default config;
