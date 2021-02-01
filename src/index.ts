import { Job } from "./job-base";
import { ModifySafeJob } from "./jobs/modify-safe";
import { Subgraph } from "./subgraph";
import * as fs from "fs";
import { SignKeyObjectInput } from "crypto";

// Load .env
require("dotenv").config();
const POLL_INTERVAL: number = Number(process.env.POLL_INTERVAL) || 2000;
const CACHE_FILE_NAME = "cache/save.tmp";

class WebHookServer {
  private jobs: Job[] = [];
  private subgraph: Subgraph;
  constructor() {
    this.subgraph = new Subgraph(process.env.GRAPH_NODE);
    this.start();
  }

  private start() {
    this.registerJobs();
    this.poll();
  }

  private registerJobs() {
    this.jobs.push(new ModifySafeJob(this.subgraph, "XXXX"));
  }

  private async poll() {
    await this.exec();
    setTimeout(() => this.poll(), POLL_INTERVAL);
  }

  private async exec() {
    console.log("Running ..");
    // const lastCheckedBlock = 23099219;
    // const currentSafeBlock = 23099319;

    // Allow for 4 confirmation block in the subgraph
    // A case of deeper reorgs the subgraph data will get overwritten and
    // we might have sent a wrong notification.

    let currentSafeBlock: number;

    try {
      currentSafeBlock = (await this.subgraph.latestSyncedBlock()) - 4;
    } catch (err) {
      console.error(`Graph node might be down: ${err}`);
      return;
    }

    const lastCheckedBlock = await this.getLatestCheckBlock();

    if (!lastCheckedBlock) {
      // First time running the app, start from the current block
      await this.saveLatestCheckBlock(currentSafeBlock);
      return;
    }

    for (let id in this.jobs) {
      try {
        await this.jobs[id].run(lastCheckedBlock, currentSafeBlock);
      } catch (err) {
        console.error(`Job id ${id} failed with error: ${err}`);
      }
    }

    // Save current block as last checked block
    await this.saveLatestCheckBlock(currentSafeBlock);
  }

  private async getLatestCheckBlock(): Promise<number | null> {
    let cacheFile: string;
    try {
      cacheFile = await fs.readFileSync(CACHE_FILE_NAME, "utf-8");
    } catch (err) {
      if (err.code === "ENOENT") {
        return null;
      } else {
        throw Error("Can't read from file system: " + err);
      }
    }

    let block: number;
    try {
      block = JSON.parse(cacheFile)["block"];
      return block;
    } catch {
      return null;
    }
  }

  private async saveLatestCheckBlock(block: number): Promise<void> {
    const data = JSON.stringify({ block });

    try {
      await fs.writeFileSync(CACHE_FILE_NAME, data);
    } catch (err) {
      throw Error("Can't write to file system: " + err);
    }
  }
}

new WebHookServer();
