import { Job } from "../job-base";
import { utils } from "geb.js";
import { ethers, utils as EthersUtils } from "ethers";
import { arrayCompare, sleep } from "../utils";

// Contracts that will need to be whitelisted whenever they are called by another contract
let WATCHLIST =
  // prettier-ignore
  {
  PROTOCOL_TOKEN_AUTHORITY: "0xcb8479840A5576B1cafBb3FA7276e04Df122FDc7",
  GEB_PAUSE_AUTHORITY: "0x1490a828957f1E23491c8d69273d684B15c6E25A",
  GEB_SAFE_ENGINE: "0xCC88a9d330da1133Df3A7bD823B95e52511A6962",
  GEB_TAX_COLLECTOR: "0xcDB05aEda142a1B0D6044C09C64e4226c1a281EB",
  GEB_LIQUIDATION_ENGINE: "0x27Efc6FFE79692E0521E7e27657cF228240A06c2",
  GEB_ACCOUNTING_ENGINE: "0xcEe6Aa1aB47d0Fb0f24f51A3072EC16E20F90fcE",
  GEB_COIN_JOIN: "0x0A5653CCa4DB1B6E265F47CAf6969e64f1CFdC45",
  GEB_SURPLUS_AUCTION_HOUSE: "0xEeF4ea1A548417Df1e7f0f6Ab89494eED9e06B70",
  GEB_DEBT_AUCTION_HOUSE: "0x1896adBE708bF91158748B3F33738Ba497A69e8f",
  GEB_PAUSE: "0x2cDE6A1147B0EE61726b86d83Fd548401B1162c7",
  GEB_PAUSE_PROXY: "0xa57A4e6170930ac547C147CdF26aE4682FA8262E",
  GEB_ORACLE_RELAYER: "0x4ed9C0dCa0479bC64d8f4EB3007126D5791f7851",
  GEB_GLOBAL_SETTLEMENT: "0x6368a4bA80fC780A9a0fEa547239C4635B97fD70",
  GEB_STABILITY_FEE_TREASURY: "0x83533fdd3285f48204215E9CF38C785371258E76",
  GEB_ESM: "0x7Cb548DF57eA728A33c4cb81698d03BC8B279eC6",
  GEB_ESM_TOKEN_BURNER: "0xB10409FC293F987841964C4FcFEf887D9ece799B",
  GEB_RRFM_CALCULATOR: "0xcFa37DcE6DFE80857c3B8DbA100b592775aE2688",
  GEB_DUMMY_RRFM_CALCULATOR: "0x9F02ddBFb4B045Df83D45c4d644027FBD7d72A6D",
  GEB_RRFM_SETTER: "0x005FaB4C9D1ef0f3E41CD27b26cF05680C3bF947",
  SAFE_MANAGER: "0xEfe0B4cA532769a3AE758fD82E1426a03A94F185",
  PROXY_FACTORY: "0xA26e15C895EFc0616177B7c1e7270A4C7D51C997",
  MEDIANIZER_RAI: "0x12A5E1c81B10B264A575930aEae80681DDF595fe",
  SPOT_RAI: "0x7235a0094eD56eB2Bd0de168d307C8990233645f",
  MEDIANIZER_ETH: "0x6A4B575Ba61D2FB86ad0Ff5e5BE286960580E71A",
  FEED_SECURITY_MODULE_ETH: "0xE6F5377DE93A361cd5531bdFbDf0f4b522E16B2B",
  GEB_JOIN_ETH_A: "0x2D3cD7b81c93f188F3CB8aD87c8Acc73d6226e3A",
  GEB_COLLATERAL_AUCTION_HOUSE_ETH_A:"0x6D2A73e16c255c1931730B776d96aAFF1909322E",
  GEB_UNISWAP_SINGLE_KEEPER_FLASH_PROXY_ETH_A:"0xC2Da0417f2A78Ad100FE092B58Fb10314Bd8F157",
  GEB_UNISWAP_MULTI_COLLATERAL_KEEPER_FLASH_PROXY:"0x12F906E4854EEDFdB1BD2DAA9100D1C3b0Cb7631",
  PROXY_PAUSE_ACTIONS: "0x27a54e99dE813CE2E41BAa7F44d1F19FBA22B36D",
  PROXY_PAUSE_SCHEDULE_ACTIONS:"0x6a2714404Be6613A952A80266840ffe916194632",
  PROXY_DEPLOYER: "0x631e38D6Dc0F4A26F6BE0d3d0E4ebA3d02033aB4",
  GEB_INCENTIVES_MINER: "0xa706d4c39c315288113020f3e2D7e1095e912a20",
  GEB_SINGLE_CEILING_SETTER: "0xB2df48A0C4A07031F538353AA35D7fFa24e25eC1",
};

// Whitelist of contract that won't trigger a notification if they call contracts from the watchlist
let WHITELIST =
  // prettier-ignore
  {
  ETH_FROM: "0x7FAfc11677649DB6AbFEC127B4B776D585520ae1",
  PROXY_DEPLOYER: "0x631e38D6Dc0F4A26F6BE0d3d0E4ebA3d02033aB4",
  MULTICALL: "0x51812e07497586ce025D798Bb44b6d11bBEe3a01",
  GEB_MULTISIG: "0x427A277eA53e25143B3b509C684aA4D0EB8bA01b",
  GEB_MULTISIG_PROXY: "0x2695b1dC32899c07d177A287f006b6569216a5a1",
  GEB_DEPLOY: "0x24AcC85528e6dd5B9C297fb8821522D36B1Ae09f",
  GEB_PROT: "0x6243d8CEA23066d098a15582d81a598b4e8391F4",
  PROTOCOL_TOKEN_AUTHORITY: "0xcb8479840A5576B1cafBb3FA7276e04Df122FDc7",
  GEB_PAUSE_AUTHORITY: "0x1490a828957f1E23491c8d69273d684B15c6E25A",
  GEB_POLLING_EMITTER: "0xf7Da963B88194a9bc6775e93d39c70c6e3f04f6F",
  GEB_SAFE_ENGINE: "0xCC88a9d330da1133Df3A7bD823B95e52511A6962",
  GEB_TAX_COLLECTOR: "0xcDB05aEda142a1B0D6044C09C64e4226c1a281EB",
  GEB_LIQUIDATION_ENGINE: "0x27Efc6FFE79692E0521E7e27657cF228240A06c2",
  GEB_ACCOUNTING_ENGINE: "0xcEe6Aa1aB47d0Fb0f24f51A3072EC16E20F90fcE",
  GEB_COIN_JOIN: "0x0A5653CCa4DB1B6E265F47CAf6969e64f1CFdC45",
  GEB_SURPLUS_AUCTION_HOUSE: "0xEeF4ea1A548417Df1e7f0f6Ab89494eED9e06B70",
  GEB_DEBT_AUCTION_HOUSE: "0x1896adBE708bF91158748B3F33738Ba497A69e8f",
  GEB_PAUSE: "0x2cDE6A1147B0EE61726b86d83Fd548401B1162c7",
  GEB_PAUSE_PROXY: "0xa57A4e6170930ac547C147CdF26aE4682FA8262E",
  GEB_GOV_ACTIONS: "0x0463bF18c2457B00402A7639fa1DFB7d60f659Ee",
  GEB_COIN: "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
  GEB_ORACLE_RELAYER: "0x4ed9C0dCa0479bC64d8f4EB3007126D5791f7851",
  GEB_GLOBAL_SETTLEMENT: "0x6368a4bA80fC780A9a0fEa547239C4635B97fD70",
  GEB_STABILITY_FEE_TREASURY: "0x83533fdd3285f48204215E9CF38C785371258E76",
  GEB_ESM: "0x7Cb548DF57eA728A33c4cb81698d03BC8B279eC6",
  GEB_ESM_TOKEN_BURNER: "0xB10409FC293F987841964C4FcFEf887D9ece799B",
  GEB_RRFM_CALCULATOR: "0xcFa37DcE6DFE80857c3B8DbA100b592775aE2688",
  GEB_DUMMY_RRFM_CALCULATOR: "0x9F02ddBFb4B045Df83D45c4d644027FBD7d72A6D",
  GEB_RRFM_SETTER: "0x005FaB4C9D1ef0f3E41CD27b26cF05680C3bF947",
  PROXY_ACTIONS: "0x880CECbC56F48bCE5E0eF4070017C0a4270F64Ed",
  PROXY_ACTIONS_INCENTIVES: "0x88A77b8Ff53329f88B8B6F9e29835FEc287349e0",
  PROXY_ACTIONS_GLOBAL_SETTLEMENT:"0x17b5d9914194a08c7Ef14451BA15E8aE4f92Cb93",
  PROXY_DEBT_AUCTION_ACTIONS: "0x8f29c9E54Ee8B1EFCEfae8d4709Ae176541E86c8",
  PROXY_SURPLUS_AUCTION_ACTIONS:"0x6f0faAEa6767731ae14696F059248Ee403c59e3B",
  SAFE_MANAGER: "0xEfe0B4cA532769a3AE758fD82E1426a03A94F185",
  GET_SAFES: "0xdf4BC9aA98cC8eCd90Ba2BEe73aD4a1a9C8d202B",
  FSM_GOV_INTERFACE: "0xe24F8B30fd28c90462c9BbC87A9A2a823636F533",
  PROXY_FACTORY: "0xA26e15C895EFc0616177B7c1e7270A4C7D51C997",
  PROXY_REGISTRY: "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4",
  MEDIANIZER_RAI: "0x12A5E1c81B10B264A575930aEae80681DDF595fe",
  SPOT_RAI: "0x7235a0094eD56eB2Bd0de168d307C8990233645f",
  ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  MEDIANIZER_ETH: "0x6A4B575Ba61D2FB86ad0Ff5e5BE286960580E71A",
  FEED_SECURITY_MODULE_ETH: "0xE6F5377DE93A361cd5531bdFbDf0f4b522E16B2B",
  FEED_SECURITY_MODULE_ETH_2: "0xD4A0E3EC2A937E7CCa4A192756a8439A8BF4bA91",
  GEB_JOIN_ETH_A: "0x2D3cD7b81c93f188F3CB8aD87c8Acc73d6226e3A",
  GEB_COLLATERAL_AUCTION_HOUSE_ETH_A:"0x6D2A73e16c255c1931730B776d96aAFF1909322E",
  GEB_UNISWAP_SINGLE_KEEPER_FLASH_PROXY_ETH_A:"0xC2Da0417f2A78Ad100FE092B58Fb10314Bd8F157",
  GEB_UNISWAP_MULTI_COLLATERAL_KEEPER_FLASH_PROXY:"0x12F906E4854EEDFdB1BD2DAA9100D1C3b0Cb7631",
  PROXY_PAUSE_ACTIONS: "0x27a54e99dE813CE2E41BAa7F44d1F19FBA22B36D",
  PROXY_PAUSE_SCHEDULE_ACTIONS:"0x6a2714404Be6613A952A80266840ffe916194632",
  GEB_INCENTIVES_MINER: "0xa706d4c39c315288113020f3e2D7e1095e912a20",
  UNISWAP_FACTORY: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  UNISWAP_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  GEB_DS_COMPARE: "0x10122261ff9520C590c0c3A679b7E3dFC8B09C64",
  GEB_TX_MANAGER: "0xB7272627825D1cb633f705BC269F8e11126D7A25",
  GEB_COIN_UNISWAP_POOL: "0x8aE720a71622e824F576b4A8C03031066548A3B1",
  GEB_SINGLE_CEILING_SETTER: "0xB2df48A0C4A07031F538353AA35D7fFa24e25eC1",
  SAFE_SAVIOUR_REGISTRY: "0x2C6F6784585B45906Fce24f30C99f8ad6d94b5d4",
  MERKLE_DISTRIBUTOR_FACTORY: "0xb5Ed650eF207e051453B68A2138D7cb67CC85E41",
  COLLATERAL_AUCTION_THROTTLER: "0x59536C9Ad1a390fA0F60813b2a4e8B957903Efc7",
  GEB_GOV_ACTIONS_2: "0xC970aCC12E40a5C48Caaf6Cb6A18844479b29D4B",
  FSM_WRAPPER_ETH: "0x105b857583346E250FBD04a57ce0E491EB204BA3",
  GEB_SAVIOUR_CRATIO_SETTER: "0xD58e867E1548D8294bc6C77585AF4015ab457880",
  NEW_MEDIANIZER_RAI: "0xB7E06D980b17f168CE1b57189F8aa34D0254FEe2",
  MEDIANIZER_RAI_TREASURY: "0xE8063b122Bef35d6723E33DBb3446092877C685",
  NEW_GEB_RRFM_CALCULATOR: "0x0564AeCEa06A74CaA67a4C4c37087851eEf56C29",
  RATE_SETTER_RELAYER: "0xD52Da90c20c4610fEf8faade2a1281FFa54eB6fB",
  NEW_RATE_SETTER: "0x7Acfc14dBF2decD1c9213Db32AE7784626daEb48",
  TREASURY_RELAYER_COIN_MEDIAN: "0xE8063b122Bef35d6723E33DBb3446092877C6855",
  GEB_NEW_SINGLE_CEILING_SETTER: "0x54999Ee378b339f405a4a8a1c2f7722CD25960fa",
  DEBT_POPPER_REWARDS: "0xe1d5181F0DD039aA4f695d4939d682C4cF874086",
  GEB_UNISWAP_V2_SAVIOUR_LIQUIDITY_MANAGER: "0x5D447CbE791E2F4c11d82f1F3E901DEc76f61763",
  GEB_COIN_ETH_UNISWAP_V2_POOL_SAVIOUR: "0xA9402De5ce3F1E03Be28871b914F77A4dd5e4364",
  MEDIANIZER_RAI_2: "0xFbF4849a06F6e6F53EcB31D2f8BD61aA7874b268",
  MEDIANIZER_ETH_2: "0xb825e25856bD98b3f2FAF2aEb6Cb8742B38C4025",
  GEB_PROXY_SAVIOR_ACTION: "0x8bcb98529ACf08580F23e35912566143E3f9B370",
  GEB_STAKED_TOKENS_TO_KEEP_SETTER: "0xaa5f19B87cC8F8A17D20f0697F1B37E112930Ae4",
  GEB_STAKING: "0x69c6C08B91010c88c95775B6FD768E5b04EFc106",

  // Front-running bots doing liquidations
  ARB_1: "0x3a518964FF40Ee733d30749A213d2e5C9FFb2B8c",
  ARB_2: "0x00000000e84F2bBdfB129ED6e495C7f879f3e634",

  // DefiSaver contracts
  RAI_Saver_Taker: "0xf036548C1bc460f0eF642B73bbde8d2aF325aAa0",
  RAISaverFlashLoan: "0xf91F8844258D3246bE5DAA201B52B51FC7fCCFD7"
};

type Trace = {
  action: {
    callType: string;
    from: string;
    gas: string;
    input: string;
    to: string;
    value: string;
  };
  blockHash: string;
  blockNumber: number;
  result: { gasUsed: string; output: string };
  subtraces: number;
  traceAddress: number[];
  transactionHash: string;
  transactionPosition: number;
  type: string;
};

export class TraceMonitorJob extends Job {
  public async run(
    lastCheckedBlock: number,
    currentSafeBlock: number
  ): Promise<void> {
    if (!process.env.PARITY_TRACE_RPC_URL) {
      throw Error("No trace provider");
    }

    // To lower case case everything
    for (let k of Object.keys(WATCHLIST)) {
      WATCHLIST[k] = WATCHLIST[k].toLowerCase();
    }
    for (let k of Object.keys(WHITELIST)) {
      WHITELIST[k] = WHITELIST[k].toLowerCase();
    }

    const traceProvider = new ethers.providers.StaticJsonRpcProvider(
      process.env.PARITY_TRACE_RPC_URL
    );

    // For each block since we last checked
    for (let i = lastCheckedBlock + 1; i <= currentSafeBlock; i++) {
      let traces: Trace[];
      let err: any

      const fetchTraces = async (block: number) =>
        traceProvider.send("trace_block", [ethers.BigNumber.from(block).toHexString()]);

      const maxAttempts = 15;
      for (let j = 0; j < maxAttempts; j++) {
        try {
          traces = await fetchTraces(i);
        } catch (error) {
          // Could not fetch the trace, wait 3 sec and retry
          err = error
          console.log(`Could not fetch block traces attempt ${j}`);
          await sleep(3000);
        }

        if (traces) {
          break;
        }

        if (j === maxAttempts - 1) {
          console.log(err)
          throw Error("Could not fetch block traces");
        }
      } 

      // Keep only traces that targets the watchlist
      let watchlistTraces = traces.filter((t) =>
        Object.values(WATCHLIST).includes(t.action.to)
      );

      // Remove traces that came from a whitelisted contract
      watchlistTraces = watchlistTraces.filter(
        (t) => !Object.values(WHITELIST).includes(t.action.from)
      );

      // Many traces will come from delegatecall of individual DS proxies
      // We remove the traces that are delegatecalled into whitelisted contract (e.g: proxy action)
      watchlistTraces = watchlistTraces.filter((inspect) => {
        if (inspect.traceAddress.length === 0) {
          // This is the top level trace, can only be EOA, pass
          return false;
        } else if (inspect.traceAddress.length === 1) {
          // Level 1 trace, EOA -> contract -> watchlist
          // Needs to be whitelisted
          return true;
        } else {
          // Get all trace for that single transaction
          const allTracesFromTransaction = traces.filter(
            (x) => x.transactionHash === inspect.transactionHash
          );
          // Find the parent trace
          const parentTraceAddress = inspect.traceAddress.slice(0, -1);
          const parentTrace = allTracesFromTransaction.find((x) =>
            arrayCompare(x.traceAddress, parentTraceAddress)
          );

          if (!parentTrace) {
            throw Error("Parity trace without parent but should have one");
          }

          if (parentTrace.action.callType === "delegatecall") {
            // If the parent is a delegate call, it's only fine if the delegatecalled contract is whitelisted
            return !Object.values(WHITELIST).includes(parentTrace.action.to);
          } else if (parentTrace.type === "create") {
            // If it's a create contract (the trace comes from a constructor) allow if the creator is whitelisted
            // This useful for the safe manager creating safeHandler contracts that call the safe engine in the constructor
            return !Object.values(WHITELIST).includes(parentTrace.action.from);
          } else {
            // If the parent is not a delegate call, it's suspicious
            return true;
          }
        }
      });
      if (watchlistTraces.length) {
        // Get the tx hashes of al transaction that have at least one suspicious trace
        const txHashes = watchlistTraces.reduce(
          (hashes, trace) => hashes.add(trace.transactionHash),
          new Set<string>()
        );

        // Get the list of contract names involved in the transaction
        let targets = watchlistTraces
          .reduce(
            (targets, trace) =>
              targets +
              " " +
              Object.keys(WATCHLIST).find(
                (key) => WATCHLIST[key] === trace.action.to
              ),
            ""
          )
          .split(" ");

        targets = [...new Set(targets)];

        for (let hash of txHashes) {
          const message = `Trace monitor notification: Unusual transaction targeting${targets.join(
            " "
          )} please inspect: https://etherscan.io/tx/${hash}`;
          this.slackProtocolUpdate(message);
        }
      }
    }
  }
}
