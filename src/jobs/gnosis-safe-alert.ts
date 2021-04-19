import { Job } from "../job-base";
import { utils } from "geb.js";
import { ethers, utils as EthersUtils } from "ethers";
import { getContractEvents } from "../utils";

const DS_PAUSE = "0x2cDE6A1147B0EE61726b86d83Fd548401B1162c7";
const GNOSIS_SAFE = "0x427A277eA53e25143B3b509C684aA4D0EB8bA01b";

export class GnosisSafeAlert extends Job {
  public async run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void> {
    // Add 1 because we already checked that block
    lastCheckedBlock += 1;

    // ABIs
    const dsPauseEventAbi = [
      "event ScheduleTransaction(address sender, address usr, bytes32 codeHash, bytes parameters, uint earliestExecutionTime)",
      "event ExecuteTransaction(address sender, address usr, bytes32 codeHash, bytes parameters, uint earliestExecutionTime)",
    ];
    const gnosisSafeAbi = [
      "event ExecutionSuccess(bytes32 txHash, uint256 payment)",
      "event ExecutionFailure(bytes32 txHash, uint256 payment)",
    ];
    // Look for GnosisSafe ExecutionSuccess events
    let events = await getContractEvents(
      gnosisSafeAbi[0],
      GNOSIS_SAFE,
      lastCheckedBlock,
      currentSafeBlock
    );

    events.map((e) => {
      return this.slackMultisigNotification(
        `Incoming transaction in the RAI manager Gnosis Safe.
Link: https://etherscan.io/tx/${e.transactionHash}`
      );
    });

    // Look for GnosisSafe ExecutionFailure events
    events = await getContractEvents(
      gnosisSafeAbi[1],
      GNOSIS_SAFE,
      lastCheckedBlock,
      currentSafeBlock
    );

    events.map((e) => {
      return this.slackMultisigNotification(
        `Gnosis safe transaction failure.
Link: https://etherscan.io/tx/${e.transactionHash}`
      );
    });
    // Look for DsPause ScheduleTransaction events
    events = await getContractEvents(
      dsPauseEventAbi[0],
      DS_PAUSE,
      lastCheckedBlock,
      currentSafeBlock
    );

    events.map((e) => {
      const args = e.args as ethers.utils.Result;
      return this.slackMultisigNotification(
        `:warning: New pending proposal scheduled in ds-pause :warning: *REVIEW* :arrow_down: 
Link: https://etherscan.io/tx/${e.transactionHash}`
      );
    });

    // Look for DsPause ExecuteTransaction events
    events = await getContractEvents(
      dsPauseEventAbi[1],
      DS_PAUSE,
      lastCheckedBlock,
      currentSafeBlock
    );

    events.map((e) => {
      const args = e.args as ethers.utils.Result;
      return this.slackMultisigNotification(
        `✨ Proposal executed in ds-pause ✨ 
Link: https://etherscan.io/tx/${e.transactionHash}`
      );
    });
  }
}
