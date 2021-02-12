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
    }`;

    type Data = {
      new: {
        debtAmount;
      };
      old: {
        debtCeiling;
        debtAmount;
      };
    };

    const resp: Data = await this.subgraph.query(query);

    console.log(resp);
    // await this.discordGebActivityChannel(message);
    // await this.discordDevChannel(message);
  }
}
