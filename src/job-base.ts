import { Subgraph } from "./subgraph";
import Axios from "axios";

export abstract class Job {
  constructor(protected subgraph: Subgraph) {}

  public abstract run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void>;

  public async slackErrorNotification(message: string) {
    let hookUrl: string;
    if (process.env.PROD === "true") {
      hookUrl = process.env.HOOK_SLACK_ERROR;
    } else {
      hookUrl = process.env.HOOK_SLACK_DEV;
    }

    if (!hookUrl) {
      throw Error("Slack error hook not specified");
    }

    console.log(message);
    await Axios.post(hookUrl, { text: message });
  }

  public async slackMultisigNotification(message: string) {
    let hookUrl: string;
    if (process.env.PROD === "true") {
      hookUrl = process.env.HOOK_SLACK_MULTISIG;
    } else {
      hookUrl = process.env.HOOK_SLACK_DEV;
    }

    if (!hookUrl) {
      throw Error("Slack multisig hook not specified");
    }

    console.log(message);
    await Axios.post(hookUrl, { text: message });
  }

  public async slackProtocolUpdate(message: string) {
    let hookUrl: string;
    if (process.env.PROD === "true") {
      hookUrl = process.env.HOOK_SLACK_PROTOCOL_UPDATE;
    } else {
      hookUrl = process.env.HOOK_SLACK_DEV;
    }

    if (!hookUrl) {
      throw Error("Slack multisig hook not specified");
    }

    console.log(message);
    await Axios.post(hookUrl, { text: message });
  }

  public async discordLiquidationChannel(message: string) {
    let hookUrl: string;
    if (process.env.PROD === "true") {
      hookUrl = process.env.HOOK_DISCORD_LIQUIDATION;
    } else {
      hookUrl = process.env.HOOK_DISCORD_DEV;
    }
    let content = {
      content: message,
    };

    console.log(message);
    await Axios.post(hookUrl, content);
  }

  public async discordGebActivityChannel(message: string) {
    let hookUrl;
    if (process.env.PROD === "true") {
      hookUrl = process.env.HOOK_DISCORD_RAI_ACTIVITY;
    } else {
      hookUrl = process.env.HOOK_DISCORD_DEV;
    }

    let content = {
      content: message,
    };

    console.log(message);
    await Axios.post(hookUrl, content);
  }

  protected getEtherscanLink(txHash: string) {
    return `https://etherscan.io/tx/${txHash}`;
  }
}
