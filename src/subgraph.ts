import Axios from "axios";
import { sleep } from "./utils";

export class Subgraph {
  constructor(private url: string) {
    if (!this.url || this.url === "") {
      throw Error("Specify graph node");
    }
  }

  public async latestSyncedBlock(): Promise<number> {
    // Dummy query that will return an error telling up to which block we are synced
    const query = `
{
    systemStates(block: {number: 999999999}) {
        id
    }
}
`;
    const prom = Axios.post(this.url, {
      query,
    });

    let resp: any;
    try {
      resp = await prom;
    } catch (err) {
      throw Error("Error with fetching synced block number: " + err);
    }
    const errorMessage = resp.data.errors[0].message;

    // Extract the last synced block form the error message
    const block = Number(
      errorMessage.match(/indexed up to block number ([0-9]*)/)[1]
    );
    return block;
  }

  public async query(query: string): Promise<any> {
    const prom = (query: string, url: string) =>
      Axios.post(this.url, {
        query,
      });

    let resp: any;
    try {
      resp = await prom(query, this.url);
    } catch {
      console.log("Subgraph query error, retry in 3sec...");
      await sleep(3000);
      try {
        resp = await prom(query, this.url);
      } catch (err) {
        throw Error("Error with subgraph query: " + err);
      }
    }

    if (!resp.data || !resp.data.data) {
      throw Error("No data");
    }

    return resp.data.data;
  }
}
