import {
  MarketAdded as MarketAddedEvent,
} from "../generated/BinaryMarketManager/BinaryMarketManager"
import { Market, Vault } from "../generated/schema"
import {BinaryMarket} from "../generated/templates/BinaryMarket/BinaryMarket";
import {BinaryMarket as BinarymarketEntity} from "../generated/templates";
import {BLACKLIST_MARKETS, ZERO_BD, ZERO_BI } from "./constants";

export function handleMarketAdded(event: MarketAddedEvent): void {
  if (BLACKLIST_MARKETS.includes(event.params.market.toHex())) {
    return;
  }
  let market = Market.load(event.params.market.toHex());

  if (market == null) {
    BinarymarketEntity.create(event.params.market);
    market = new Market(event.params.market.toHex());
    market.address = event.params.market;
    market.paused = false;
    market.totalUsers = ZERO_BI;
    market.totalBets = ZERO_BI;
    market.totalBetsBull = ZERO_BI;
    market.totalBetsBear = ZERO_BI;
    market.totalAmount = ZERO_BD;
    market.totalBearAmount = ZERO_BD;
    market.totalBullAmount = ZERO_BD;
    market.name = event.params.marketName;
    market.pairName = event.params.pairName;
    market.epoch = ZERO_BI;
    market.genesisStartTime = ZERO_BI;
    market.decimals = 6;
    market.symbol = "USDC";

    let marketContract = BinaryMarket.bind(event.params.market);
    let vault = Vault.load(marketContract.vault().toHex());

    if (vault !== null) {
      market.decimals = vault.decimals
      market.symbol = vault.symbol;
    }
    
    market.save()
  }
  
}