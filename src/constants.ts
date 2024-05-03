import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const ZERO_BI = BigInt.fromI32(0);
export const ONE_BI = BigInt.fromI32(1);
export const ONE_BD = BigDecimal.fromString("1");
export const ZERO_BD = BigDecimal.fromString("0");
export const EIGHT_BD = BigDecimal.fromString("1e8");
export const EIGHTEEN_BD = BigDecimal.fromString("1e18");

export const SIX_BD = BigDecimal.fromString("1e6");
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const BLACKLIST_MARKETS: string[] = [];

export const BLACKLIST_VAULTS: string[] = [];