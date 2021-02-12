import { ethers } from "ethers";
import { Geb } from "geb.js";

export const getGeb = async () => {
  const rpc = process.env.RPC_URL;

  if (!rpc) {
    throw Error("No RPC provided");
  }
  const provider = new ethers.providers.StaticJsonRpcProvider(rpc);
  const net = (await provider.getNetwork()).chainId;
  return new Geb(net == 1 ? "mainnet" : "kovan", provider);
};
