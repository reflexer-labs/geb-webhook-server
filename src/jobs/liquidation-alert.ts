import { Job } from "../job-base";
import { utils } from "geb.js";
import { utils as EthersUtils } from "ethers";
import { getContractEvents } from "../utils";

const LIQUIDATION_ENGINE = "0x4fFbAA89d648079Faafc7852dE49EA1dc92f9976";

export class LiquidationAlertJob extends Job {
  public async run(lastCheckedBlock: number, currentSafeBlock: number): Promise<void> {
    // Fetch liquidation from the subgraph
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

    const getSafeIdFromHandler = async (handler: string) => {
      const query = `{safes(where: {safeHandler: "${handler}"}){safeId}}`;
      const safeDetail = await this.subgraph.query(query);
      let safeId: string;
      if (!safeDetail.safes.length || !safeDetail.safes[0].safeId) {
        safeId = "unknown";
      } else {
        safeId = safeDetail.safes[0].safeId;
      }

      return safeId;
    };

    const resp: AuctionData = await this.subgraph.query(query);
    for (let liquidation of resp.discountAuctions) {
      let message = `Safe #${await getSafeIdFromHandler(
        liquidation.safeHandler
      )} was just liquidated ☠ ${Number(liquidation.sellInitialAmount).toFixed(
        2
      )} ETH of collateral is for sale in auction #${liquidation.auctionId} [[link](<${this.getEtherscanLink(
        liquidation.createdAtTransaction
      )}>)]`;

      await this.discordLiquidationChannel(message);
    }

    for (let liquidation of resp.discountAuctionBatches) {
      let message = `Someone just bid ${Number(liquidation.buyAmount).toFixed(2)} RAI for ${Number(
        liquidation.sellAmount
      ).toFixed(2)} ETH in auction #${liquidation.auction.auctionId} 🤝 [[link](<${this.getEtherscanLink(
        liquidation.createdAtTransaction
      )}>)]`;

      await this.discordLiquidationChannel(message);
    }

    // Fetch saved safe from events
    const liquidationEngineAbi = [
      "event SaveSAFE(bytes32 indexed collateralType, address indexed safe, uint256 collateralAddedOrDebtRepaid)",
    ];

    const events = await getContractEvents(
      liquidationEngineAbi[0],
      LIQUIDATION_ENGINE,
      lastCheckedBlock,
      currentSafeBlock
    );

    for (let event of events) {
      const message = `Safe id #${await getSafeIdFromHandler(
        event.args.safe
      )} was just saved from liqudiation 🥰 [[link](<${this.getEtherscanLink(event.transactionHash)}>)]`;
      await this.discordLiquidationChannel(message);
    }
  }
}
