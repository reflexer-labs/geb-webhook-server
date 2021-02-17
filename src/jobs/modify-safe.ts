import { Job } from "../job-base";

export class ModifySafeJob extends Job {
  public async run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void> {
    const query = `{
modifySAFECollateralizations(where: {createdAtBlock_gt: ${lastCheckedBlock}, createdAtBlock_lte: ${currentSafeBlock}}, orderBy: createdAt, orderDirection: asc, first: 1000) {
        deltaDebt
        deltaCollateral
        safeHandler
        accumulatedRate
        createdAtTransaction
    }
}`;

    const resp = await this.subgraph.query(query);

    type Change = {
      deltaDebt: string;
      deltaCollateral: string;
      safeHandler: string;
      accumulatedRate: string;
      createdAtTransaction: string;
    };

    const changes: Change[] = resp.modifySAFECollateralizations;

    let filteredChanges = changes.reduce<Change[]>((res, val) => {
      let match = res.find(
        (x) => x.createdAtTransaction === val.createdAtTransaction
      );
      if (match) {
        match.deltaDebt = String(
          Number(val.deltaDebt) + Number(match.deltaDebt)
        );
        match.deltaCollateral = String(
          Number(val.deltaCollateral) + Number(match.deltaCollateral)
        );
      } else {
        res.push({
          deltaDebt: val.deltaDebt,
          deltaCollateral: val.deltaCollateral,
          safeHandler: val.safeHandler,
          accumulatedRate: val.accumulatedRate,
          createdAtTransaction: val.createdAtTransaction,
        });
      }
      return res;
    }, []);

    for (let change of filteredChanges) {
      const deltaDebt =
        Number(change.deltaDebt) * Number(change.accumulatedRate);
      const deltaCollateral = Number(change.deltaCollateral);

      // Skip if a dusty move
      if (deltaDebt < 0.1 && deltaCollateral < 0.1) {
        continue;
      }

      // Get the safe id
      const query = `{safes(where: {safeHandler: "${change.safeHandler}"}){safeId}}`;
      const safeDetail = await this.subgraph.query(query);
      if (!safeDetail.safes.length || !safeDetail.safes[0].safeId) {
        // Not a standard safe, skip
        continue;
      }
      const safeId = Number(safeDetail.safes[0].safeId);

      // Craft message
      let message: string;
      // Deposit & Borrow
      if (deltaDebt > 0 && deltaCollateral > 0) {
        message = `Safe #${safeId} added ${deltaCollateral.toFixed(
          2
        )} ETH of collateral and borrowed ${deltaDebt.toFixed(2)} RAI 🤑`;
      }
      // Repay & Withdraw
      else if (deltaCollateral < 0 && deltaDebt < 0) {
        message = `Safe #${safeId} repaid ${(-1 * deltaDebt).toFixed(
          2
        )} of RAI debt of withdrew ${(-1 * deltaCollateral).toFixed(
          2
        )} ETH of collateral 🍃🍃`;
      }
      // Borrow
      else if (deltaCollateral === 0 && deltaDebt > 0) {
        message = `Safe #${safeId} borrowed ${deltaDebt.toFixed(2)} RAI 🤑`;
      }
      // Repay
      else if (deltaCollateral === 0 && deltaDebt < 0) {
        message = `Safe #${safeId} repaid ${deltaDebt.toFixed(2)} RAI 🍃🍃`;
      }
      // Deposit
      else if (deltaDebt === 0 && deltaCollateral > 0) {
        message = `Safe #${safeId} just deposited ${deltaCollateral.toFixed(
          2
        )} ETH 🤑`;
      }
      // Withdraw
      else if (deltaDebt === 0 && deltaCollateral > 0) {
        message = `Safe #${safeId} just withdrew ${deltaCollateral.toFixed(
          2
        )} ETH 🍃🍃`;
      }

      const isWhale = deltaDebt >= 200000; // 200k RAI
      if (isWhale) {
        message += "🐳🐳";

        // Post to twitter
        const tweet =
          message + ` ${this.getEtherscanLink(change.createdAtTransaction)}`;
        await this.postTweet(tweet);
      }

      message += `  [[link](<${this.getEtherscanLink(
        change.createdAtTransaction
      )}>)]`;

      // Post in Discord
      await this.discordGebActivityChannel(message);
    }
  }
}
