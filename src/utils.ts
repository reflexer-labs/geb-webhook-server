import { ethers } from "ethers";
import { Geb } from "geb.js";
import Axios from "axios";
export const getGeb = async () => {
  const provider = getProvider();
  const net = (await provider.getNetwork()).chainId;
  return new Geb(net == 1 ? "mainnet" : "kovan", provider);
};

export const getProvider = () => {
  const rpc = process.env.RPC_URL;
  if (!rpc) {
    throw Error("No RPC provided");
  }
  return new ethers.providers.StaticJsonRpcProvider(rpc);
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
  );

export const getContractEvents = async (
  abi: string,
  address: string,
  fromBlock: number,
  toBlock: number
) => {
  const contract = new ethers.Contract(address, [abi], getProvider());
  const filterName = abi.split(" ")[1].split("(")[0];
  const filter = contract.filters[filterName]();
  let events = await contract.queryFilter(filter, fromBlock, toBlock);

  return events;
};
