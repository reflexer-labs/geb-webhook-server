import { ethers } from "ethers";
import { Geb } from "geb.js";
import Axios from "axios"
export const getGeb = async () => {
  const rpc = process.env.RPC_URL;

  if (!rpc) {
    throw Error("No RPC provided");
  }
  const provider = new ethers.providers.StaticJsonRpcProvider(rpc);
  const net = (await provider.getNetwork()).chainId;
  return new Geb(net == 1 ? "mainnet" : "kovan", provider);
};

export const arrayCompare = (a, b) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getEthPrice = async () => 
  parseFloat(
    (
      await Axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      )
    ).data.ethereum.usd
  )
