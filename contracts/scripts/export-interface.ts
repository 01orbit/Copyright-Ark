import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { network } from "hardhat";

const artifactPath = join(process.cwd(), "artifacts/contracts/CopyrightMarket.sol/CopyrightMarket.json");
const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
const outDir = join(process.cwd(), "../frontend/src/generated");
const { viem } = await network.connect();
const chainId = await (await viem.getPublicClient()).getChainId();
if (chainId !== 31337 && chainId !== 11155111) throw new Error(`Unsupported chain ${chainId}`);
const { deployment } = JSON.parse(await readFile(join(process.cwd(), `deployments/${chainId}.json`), "utf8"));
// Keep the other network's record when switching between local and Sepolia.
let deployments = { schemaVersion: 1, deployments: {} as Record<string, unknown> };
try {
  deployments = JSON.parse(await readFile(join(outDir, "deployments.json"), "utf8"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
deployments.deployments[String(chainId)] = deployment;
await mkdir(outDir,{recursive:true});
await writeFile(join(outDir,"copyrightMarketAbi.ts"), `export const copyrightMarketAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`);
await writeFile(join(outDir,"deployments.json"),JSON.stringify(deployments,null,2));
await writeFile(join(outDir,"interface-manifest.json"),JSON.stringify({schemaVersion:1,termsVersion:"CopyrightLicenseTerms/v1",exportedAt:new Date().toISOString()},null,2));
console.log(`Exported interface for chain ${chainId}`);
