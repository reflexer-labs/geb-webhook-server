import { Job } from "../job-base";
import { utils } from "geb.js";
import { utils as EthersUtils } from "ethers";
import { getGeb } from "../utils";

export class CeilingChecker extends Job {
  public async run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void> {
    const query = `{
      old: collateralType(id: "ETH-A", block: {number: ${lastCheckedBlock}}) {
        debtAmount
      }
      new: collateralType(id: "ETH-A", block: {number: ${currentSafeBlock}}) {
        debtCeiling
        debtAmount
      }
      oldSys: systemState(id: "current", block: {number: ${lastCheckedBlock}}) {
        coinUniswapPair {
          reserve0
          reserve1
        }
      }
      newSys: systemState(id: "current", block: {number: ${currentSafeBlock}}) {
        coinUniswapPair {
          reserve0
          reserve1
        }
      }
    }`;

    type Data = {
      new: {
        debtAmount: string;
        debtCeiling: string;
      };
      old: {
        debtAmount: string;
      };
      oldSys: {
        coinUniswapPair: {
          reserve0: string;
          reserve1: string;
        };
      };
      newSys: {
        coinUniswapPair: {
          reserve0: string;
          reserve1: string;
        };
      };
    };

    const resp: Data = await this.subgraph.query(query);

    // Debt ceiling alerts
    const oldDebtAmt = Number(resp.old.debtAmount);
    const newDebtAmt = Number(resp.new.debtAmount);

    const ceiling = Number(resp.new.debtCeiling);
    const highThreshold = 0.8 * ceiling;
    const lowThreshold = 0.4 * ceiling;

    if (oldDebtAmt < highThreshold && newDebtAmt >= highThreshold) {
      const message = `RAI supply rose above ${
        0.0008 * 100
      }% of debt ceiling capacity`;
      this.slackProtocolUpdate(message);
    } else if (oldDebtAmt > lowThreshold && newDebtAmt < highThreshold) {
      const message = `RAI supply felt below ${
        0.4 * 100
      }% of debt ceiling capacity`;
      this.slackProtocolUpdate(message);
    }

    const oldRaiSupply = Math.min(
      Number(resp.oldSys.coinUniswapPair.reserve0),
      Number(resp.oldSys.coinUniswapPair.reserve0)
    );

    const newRaiSupply = Math.min(
      Number(resp.newSys.coinUniswapPair.reserve0),
      Number(resp.newSys.coinUniswapPair.reserve0)
    );

    // Uniswap pool liquidity threshold alert
    const supplyThreshold = 0.03;
    if (
      oldRaiSupply > oldDebtAmt * supplyThreshold &&
      newRaiSupply < newDebtAmt * supplyThreshold
    ) {
      const message = `Supply in RAI/ETH Uniswap V2 pool felt below ${
        supplyThreshold * 100
      }% of RAI supply`;

      this.slackProtocolUpdate(message);
    }
  }
}
