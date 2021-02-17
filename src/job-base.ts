import { Subgraph } from "./subgraph";
import Axios from "axios";
import { sleep } from "./utils";
import Twit from "twit";

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

    await sleep(1000);

    console.log(message);
    await Axios.post(hookUrl, content);
  }

  public async postTweet(tweet: string) {
    const twit = new Twit({
      consumer_key: process.env.TWITTER_CONSUMER_KEY as string,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET as string,
      access_token: process.env.TWITTER_ACCESS_TOKEN as string,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET as string,
    });

    await new Promise<any>((resolve, reject) => {
      twit.post(
        "statuses/update",
        {
          status: tweet,
        },
        // Callback
        (err, data, response) => {
          if (err) {
            reject(err);
          } else {
            console.log(`Twitter API post success: ${response.statusCode}`);
            resolve(data);
          }
        }
      );
    });
  }

  protected getEtherscanLink(txHash: string) {
    return `https://etherscan.io/tx/${txHash}`;
  }
}
