import { Job } from "../job-base";
import { utils } from "geb.js";
import { utils as EthersUtils } from "ethers";
import { getContractEvents } from "../utils";

const RAI_GOVERNOR = "0x7a6BBe7fDd793CC9ab7e0fc33605FCd2D19371E8";

export class GovProposals extends Job {
  public async run(lastCheckedBlock: number, currentSafeBlock: number): Promise<void> {
    // Fetch saved safe from events
    const governorAbi = [
      "event ProposalCanceled(uint256 id)",
      "event ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
      "event ProposalExecuted(uint256 id)",
      "event ProposalQueued(uint256 id, uint256 eta)",
    ];

    for (let evt of governorAbi) {
      const events = await getContractEvents(evt, RAI_GOVERNOR, lastCheckedBlock + 1, currentSafeBlock);

      for (let event of events) {
        await this.slackMultisigNotification(
          `New RAI governor event \`${
            evt.split(" ")[1].split("(")[0]
          }\` in transaction: https://etherscan.io/tx/${event.transactionHash}`
        );
      }
    }
  }
}
