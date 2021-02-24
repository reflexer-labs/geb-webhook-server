import { Job } from "../job-base";
import { utils } from "geb.js";
import { utils as EthersUtils } from "ethers";
import { getEthPrice } from "../utils";

export class SwapJob extends Job {
  public async run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void> {
    const query = `{
        sell:uniswapSwaps(where: {amount0In_gte: 50000, createdAtBlock_gt: ${lastCheckedBlock}, createdAtBlock_lte: ${currentSafeBlock}}) {
          amount1Out
          amount0In
          sender
          createdAtTransaction
        }
        buy:uniswapSwaps(where: {amount0Out_gte: 50000, createdAtBlock_gt: ${lastCheckedBlock}, createdAtBlock_lte: ${currentSafeBlock}}) {
          amount0Out
          amount1In
          sender
          createdAtTransaction
        }
      } `;

    // amount0 is RAI
    // amount1 is ETH
    type Swaps = {
      buy: {
        amount0Out: string;
        amount1In: string;
        sender: string;
        createdAtTransaction: string;
      }[];
      sell: {
        amount1Out: string;
        amount0In: string;
        sender: string;
        createdAtTransaction: string;
      }[];
    };

    const resp: Swaps = await this.subgraph.query(query);

    const buys = resp.buy;
    const sells = resp.sell;

    let ethPrice;
    if (buys.length === 0 && sells.length === 0) {
      return;
    } else {
      try {
        ethPrice = await getEthPrice();
      } catch {
        throw Error(`ETH price from CG not available ${ethPrice}`);
      }
    }

    for (let buy of buys) {
      const ETHamount = Number(buy.amount1In);
      const RAIamount = Number(buy.amount0Out);
      const message = `Someone just bought ${RAIamount.toFixed(0)} RAI at $${(
        (ETHamount / RAIamount) *
        ethPrice
      ).toFixed(3)} for ${ETHamount.toFixed(
        1
      )} ETH on Uniswap 🦄💱🐳 [[link](<${this.getEtherscanLink(
        buy.createdAtTransaction
      )}>)]`;

      await this.discordGebActivityChannel(message);
    }

    for (let sell of sells) {
      const ETHamount = Number(sell.amount1Out);
      const RAIamount = Number(sell.amount0In);
      const message = `Someone just sold ${RAIamount.toFixed(0)} RAI at $${(
        (ETHamount / RAIamount) *
        ethPrice
      ).toFixed(3)} for ${ETHamount.toFixed(
        1
      )} ETH on Uniswap 🦄💱🐳 [[link](<${this.getEtherscanLink(
        sell.createdAtTransaction
      )}>)]`;

      await this.discordGebActivityChannel(message);
    }
  }
}
