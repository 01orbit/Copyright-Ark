import { defineConfig } from "hardhat/config";
import toolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";
export default defineConfig({
  plugins: [toolboxViem],
  solidity:{version:"0.8.28",settings:{optimizer:{enabled:true,runs:1,details:{yul:true}},viaIR:true,evmVersion:"cancun"}},
  networks:{
    hardhat:{type:"edr-simulated",chainType:"l1",chainId:31337},
    localhost:{type:"http",url:"http://127.0.0.1:8545",chainType:"l1"},
    sepolia: {
      type: "http",
      chainType: "l1",
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      // Read-only checks work without a wallet; deployment requires a test key.
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      timeout: 15_000,
    }
  }
});
