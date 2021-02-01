import { Subgraph } from "./subgraph";
import Axios from "axios";

export abstract class Job {
  constructor(protected subgraph: Subgraph, private hookUrl: string) {
    if (typeof hookUrl !== "string" || hookUrl === "") {
      throw Error("Specify hook url");
    }
  }

  public abstract run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void>;

  public async slackErrorNotification(message: string) {
    await Axios.post(this.hookUrl, { text: message });
  }
}
