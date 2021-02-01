import { Job } from "../job-base";

export class ModifySafeJob extends Job {
  public async run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void> {
    const query = `{
modifySAFECollateralizations(where: {createdAtBlock_gt: ${lastCheckedBlock}, createdAtBlock_lte: ${currentSafeBlock}}) {
        deltaDebt
        deltaCollateral
        safeHandler
        accumulatedRate
        createdAtTransaction
        createdAtBlock
    }
}`;

    const resp = await this.subgraph.query(query);

    const changes: any[] = resp.modifySAFECollateralizations;

    for (let change of changes) {
      console.log(`change ${change.safeHandler}`);
    }
  }
}
