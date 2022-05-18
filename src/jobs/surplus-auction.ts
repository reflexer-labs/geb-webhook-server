import { Job } from "../job-base";

export class SurplusAuctionJob extends Job {
  public async run(lastCheckedBlock: number, currentSafeBlock: number): Promise<void> {
    const query = `{
      englishAuctions(where: {englishAuctionType: "SURPLUS", createdAtBlock_gt: ${lastCheckedBlock}, createdAtBlock_lte: ${currentSafeBlock}}) {
        auctionId
        createdAtTransaction
        sellInitialAmount
      }

      englishAuctionBids(where: {type: "INCREASE_BUY", createdAtBlock_gt: ${lastCheckedBlock}, createdAtBlock_lte: ${currentSafeBlock}}) {
        createdAtTransaction
        sellAmount
        buyAmount
        bidder
        auction {
          auctionId
        }
      }
    }`;

    let resp = await this.subgraph.query(query);

    const newAuctions: { auctionId: string; createdAtTransaction: string; sellInitialAmount: string }[] =
      resp.englishAuctions;

    const newBids: {
      createdAtTransaction: string;
      sellAmount: string;
      buyAmount: string;
      bidder: string;
      auction: { auctionId: string };
    }[] = resp.englishAuctionBids;

    for (let auction of newAuctions) {
      let message = `Surplus auction ID #${auction.auctionId} was just stared, ${Number(
        auction.sellInitialAmount
      ).toFixed(2)} RAI are being auctioned. Bids open 🏦 [[link](<${this.getEtherscanLink(
        auction.createdAtTransaction
      )}>)]`;

      await this.discordGebActivityChannel(message);
    }

    for (let bid of newBids) {
      let message = `Address ${bid.bidder.slice(0, 6) + "..." + bid.bidder.slice(-4)} just bid ${Number(
        bid.buyAmount
      ).toFixed(2)} FLX for ${Number(bid.sellAmount).toFixed(2)} RAI on auction ID #${
        bid.auction.auctionId
      } 💰 [[link](<${this.getEtherscanLink(bid.createdAtTransaction)}>)]`;
      await this.discordGebActivityChannel(message);
    }
  }
}
