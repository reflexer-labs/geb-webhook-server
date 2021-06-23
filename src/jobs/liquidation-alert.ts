import { Job } from "../job-base";
import { utils } from "geb.js";
import { utils as EthersUtils } from "ethers";

export class LiquidationAlertJob extends Job {
  public async run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void> {
    const query = `{
        discountAuctions(where: {createdAtBlock_gt: ${lastCheckedBlock}, createdAtBlock_lte: ${currentSafeBlock}}) {
          safeHandler
          sellInitialAmount
          auctionId
          createdAtTransaction
        }
        discountAuctionBatches(where: {createdAtBlock_gt: ${lastCheckedBlock}, createdAtBlock_lte: ${currentSafeBlock}}) {
          createdAtBlock
          sellAmount
          auction {
            auctionId
          }
          buyAmount
          buyer
          createdAtTransaction
        }
}`;

    type AuctionData = {
      discountAuctions: {
        safeHandler: string;
        auctionId: string;
        sellInitialAmount: string;
        createdAtTransaction: string;
      }[];
      discountAuctionBatches: {
        createdAtBlock: string;
        sellAmount: string;
        buyAmount: string;
        auction: {
          auctionId: string;
        };
        buyer: string;
        createdAtTransaction: string;
      }[];
    };

    const resp: AuctionData = await this.subgraph.query(query);
    for (let liquidation of resp.discountAuctions) {
      // Get the safe id
      const query = `{safes(where: {safeHandler: "${liquidation.safeHandler}"}){safeId}}`;
      const safeDetail = await this.subgraph.query(query);
      let safeId: string;
      if (!safeDetail.safes.length || !safeDetail.safes[0].safeId) {
        safeId = "unknown";
      } else {
        safeId = safeDetail.safes[0].safeId;
      }

      let message = `Safe #${safeId} was just liquidated ☠ ${Number(
        liquidation.sellInitialAmount
      ).toFixed(2)} ETH of collateral is for sale in auction #${
        liquidation.auctionId
      } [[link](<${this.getEtherscanLink(liquidation.createdAtTransaction)}>)]`;

      await this.discordLiquidationChannel(message);
    }

    for (let liquidation of resp.discountAuctionBatches) {
      let message = `Someone just bid ${Number(liquidation.buyAmount).toFixed(
        2
      )} RAI for ${Number(liquidation.sellAmount).toFixed(2)} ETH in auction #${
        liquidation.auction.auctionId
      } 🤝 [[link](<${this.getEtherscanLink(
        liquidation.createdAtTransaction
      )}>)]`;

      await this.discordLiquidationChannel(message);
    }
  }
}
