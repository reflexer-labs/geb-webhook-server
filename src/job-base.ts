import { Subgraph } from "./subgraph";
import Axios from "axios";

export abstract class Job {
  constructor(protected subgraph: Subgraph) {}

  public abstract run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void>;

  public async slackErrorNotification(message: string) {
    let hookUrl = process.env.HOOK_SLACK_ERROR;

    if (!hookUrl) {
      throw Error("Slack error hook not specified");
    }

    await Axios.post(hookUrl, { text: message });
  }

  public async slackMultisigNotification(message: string) {
    let hookUrl = process.env.HOOK_SLACK_MULTISIG;

    if (!hookUrl) {
      throw Error("Slack multisig hook not specified");
    }

    await Axios.post(hookUrl, { text: message });
  }

  public async slackProtocolUpdate(message: string) {
    let hookUrl = process.env.HOOK_SLACK_PROTOCOL_UPDATE;

    if (!hookUrl) {
      throw Error("Slack multisig hook not specified");
    }

    await Axios.post(hookUrl, { text: message });
  }

  public async discordLiquidationChannel(message: string) {
    let hookUrl = process.env.HOOK_DISCORD_LIQUIDATION;
    let content = {
      content: message,
    };

    await Axios.post(hookUrl, content);
  }

  public async discordGebActivityChannel(message: string) {
    let hookUrl = process.env.HOOK_DISCORD_RAI_ACTIVITY;
    let content = {
      content: message,
    };

    await Axios.post(hookUrl, content);
  }

  public async discordDevChannel(message: string) {
    let hookUrl = process.env.HOOK_DISCORD_DEV;
    let content = {
      content: message,
    };

    await Axios.post(hookUrl, content);
  }

  protected getEtherscanLink(txHash: string) {
    return `https://etherscan.io/tx/${txHash}`;
  }
}
