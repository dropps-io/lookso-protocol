import { LSPFactory } from '@lukso/lsp-factory.js';
import hre from "hardhat";
import { JsonRpcProvider } from "@ethersproject/providers";


export async function deployUP(provider: JsonRpcProvider) {
    const lspFactory = new LSPFactory(provider as any, {
        deployKey: (hre as any).userConfig.networks.hardhat.accounts[0].privateKey,
        chainId: (await provider.getNetwork()).chainId
    })
    let deployedContracts;
    if (process.env.L16ADDRESS) {
        deployedContracts = await lspFactory.UniversalProfile.deploy(
            {
                controllerAddresses: [process.env.L16ADDRESS], // our EOA that will be controlling the UP
                lsp3Profile: "ipfs://QmRsxZdtHrrLQo54mkakAr5e1w7C3xgpapYJiQbj4Pwysz"
                },
                {
                    LSP0ERC725Account: {
                        deployProxy: false,
                    }, 
                    LSP1UniversalReceiverDelegate: {
                        deployProxy:false
                    }
                }
        );
    } else {
        throw Error("UP controller not found upon deployment. Check the address from your Browser Extension and fill the .env constant L16ADDRESS");
    }
    
    return [deployedContracts.LSP0ERC725Account?.address, deployedContracts.LSP6KeyManager.address];
}