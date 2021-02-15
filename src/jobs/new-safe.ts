import { Job } from "../job-base";
import { utils } from "geb.js";
import { utils as EthersUtils } from "ethers";

export class NewSafeJob extends Job {
  public async run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void> {
    const query = `{
        safes(where: {createdAtBlock_gt: ${lastCheckedBlock}, createdAtBlock_lte: ${currentSafeBlock}}) {
          safeId
          createdAtTransaction
          owner {
            address
          }
        }
}`;

    const resp = await this.subgraph.query(query);

    type Safe = {
      safeId: string;
      createdAtTransaction: string;
      owner: {
        address: string;
      };
    };

    const safes: Safe[] = resp.safes;

    for (let safe of safes) {
      let address = EthersUtils.getAddress(safe.owner.address);
      address = address.slice(0, 6) + "..." + address.slice(-4);

      // Skip unmanaged safes
      if (!safe.safeId) {
        continue;
      }

      // Craft message
      let message = `New safe id #${
        safe.safeId
      } owned by ${address} 📦 [[link](<${this.getEtherscanLink(
        safe.createdAtTransaction
      )}>)]`;

      await this.discordGebActivityChannel(message);
    }
  }
}
