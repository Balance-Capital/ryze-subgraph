import { Bet, Market, Payout, Round, TotalBet, User, Vault, WinBet } from "../generated/schema";
import { Address, BigDecimal, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import {
  EndRound as EndRoundEvent,
  LockRound as LockRoundEvent,
  PositionOpened as PositionOpenedEvent,
  PositionOpened1 as PositionOpenedEventCredit,
  StartRound as StartRoundEvent,
  Claimed as ClaimedEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent,
  OracleChanged as OracleChangedEvent,
  MarketNameChanged as MarketNameChangedEvent,
  AdminChanged as AdminChangedEvent,
  OperatorChanged as OperatorChangedEvent,
  BetReverted as BetRevertedEvent,
  GenesisStartTimeSet
} from "../generated/templates/BinaryMarket/BinaryMarket";
import {EIGHTEEN_BD, ONE_BI, ZERO_BD, ZERO_BI, ONE_BD, SIX_BD, EIGHT_BD } from "./constants";
import { genearteBetId, generatePayoutId, generateRoundId, generateTotalBetId, generateWinBetId, getBlockTimeForEpoch, getDurationForTimeframeId } from "./helpers";
import { BinaryMarket } from "../generated/templates";

export function handleClaimed(
  event: ClaimedEvent
): void {
  // generate bet id 
  const betId = genearteBetId(event.address, event.params.timeframeId, event.params.roundId, event.params.user);
  let bet = Bet.load(betId);

  if (bet === null) {
    log.warning("None existing bet {}", [betId]);
    return;
  }

  let market = Market.load(event.address.toHex());
  if (market === null) {
    log.warning("No market {}", [event.address.toHex()]);
    return;
  }

  let decimals = SIX_BD;
  if (market.decimals == 6) {
    decimals = SIX_BD;
  } else if (market.decimals == 18) {
    decimals = EIGHTEEN_BD;
  } else {
    decimals = SIX_BD;
  }

  bet.claimed = true;
  bet.claimedAmount = event.params.amount.divDecimal(decimals);
  bet.claimedHash = event.transaction.hash;
  bet.updatedAt = event.block.timestamp;
  
  if (bet.isReverted == true) {
    bet.save();
    return;
  }
  bet.isReverted = event.params.isRefund;
  bet.save();

  if (event.params.isRefund) {
    revertUserBets(event.address, event.params.timeframeId, event.params.user, bet.amount);
    revertRoundBets(event.address, event.params.timeframeId, event.params.roundId, bet.position, bet.amount, ONE_BI);
    return;
  }

  const payoutId = generatePayoutId(event.address, event.params.user);
  let payout = Payout.load(payoutId);

  if (payout === null) {
    payout = new Payout(payoutId);
    payout.user = event.params.user.toHex();
    payout.market = event.address;
    payout.amount = ZERO_BD;
  }

  let user = User.load(event.params.user.toHex());

  if (user === null) {
    user = new User(event.params.user.toHex());
    user.address = event.params.user;
    user.address_string = event.params.user.toHexString();
    user.createdAt = event.block.timestamp;
    user.updatedAt = event.block.timestamp;
    user.block = event.block.number;
    user.wholeBetAmount = ZERO_BD;
    user.wholePayoutAmount = ZERO_BD;
    user.profit_lose = ZERO_BD;
    user.roi = ZERO_BD;

    user.balance = ZERO_BD;
    user.invest = ZERO_BD;
  }

  user.updatedAt = event.block.timestamp;
  user.save();

  payout.amount = payout.amount.plus(event.params.amount.divDecimal(decimals));
  payout.save();

  const winBetId = generateWinBetId(event.address, event.params.user);
  let winBet = WinBet.load(winBetId);

  if (winBet === null) {
    winBet = new WinBet(winBetId);
    winBet.count = ZERO_BI;
    winBet.user = event.params.user.toHex();
    winBet.market = event.address;
    winBet.amount = ZERO_BD;
  }

  winBet.count = winBet.count.plus(ONE_BI);
  winBet.amount = winBet.amount.plus(event.params.amount.divDecimal(decimals));

  winBet.save();
}

export function handleEndRound(event: EndRoundEvent): void {
  const roundId = generateRoundId(event.address, event.params.timeframeId, event.params.epoch);
  let round = Round.load(roundId);

  if (round === null) {
    log.error("Tried to end round without an existing round (epoch: {}).", [event.params.epoch.toString()]);
    return;
  }

  round.endAt = event.block.timestamp;
  round.endBlock = event.block.number;
  round.endHash = event.transaction.hash;
  round.closePrice = event.params.price.divDecimal(EIGHT_BD);

  // Get round result based on lock/close price.
  if (round.closePrice && round.lockPrice) {
    if ((round.closePrice as BigDecimal).equals(round.lockPrice as BigDecimal)) {
      round.position = "House";
    } else if ((round.closePrice as BigDecimal).gt(round.lockPrice as BigDecimal)) {
      round.position = "Bull";
    } else if ((round.closePrice as BigDecimal).lt(round.lockPrice as BigDecimal)) {
      round.position = "Bear";
    } else {
      round.position = null;
    }
    round.failed = false;

    updateInvestAmounts(round);
    round.save();
  }
}


export function handleLockRound(event: LockRoundEvent): void {
  const roundId = generateRoundId(event.address, event.params.timeframeId, event.params.epoch)
  let round = Round.load(roundId);
  if (round === null) {
    log.error("Tried to lock round without an existing round (epoch: {}).", [event.params.epoch.toString()]);
    return;
  }

  round.lockAt = event.block.timestamp;
  round.lockBlock = event.block.number;
  round.lockHash = event.transaction.hash;
  round.lockPrice = event.params.price.divDecimal(EIGHT_BD);
  round.save();
}

function updateInvestAmounts(round: Round): void {
  let bets = round.bets.load();
  if (bets == null || bets.length == 0) {
    return;
  }

  let roundPosition = round.position;

  for (let i = 0; i < bets.length; i++) {
    let bet = bets[i];
    if (bet != null && bet.isReverted == false) {
      let userAddress = bet.user;
      let user = User.load(userAddress);
      if (user !== null) {
        let p_l = bet.position == roundPosition
          ? bet.amount.times(BigInt.fromI32(9).divDecimal(ONE_BD)).div(BigInt.fromI32(10).divDecimal(ONE_BD))
          : ZERO_BD.minus(bet.amount);

        if (user.wholeBetAmount == ZERO_BD) {
          // first transaction
          user.invest = bet.amount;
          user.balance = bet.amount.plus(p_l);
        } else {
          let oldInvest = user.invest;
          if (user.balance.lt(bet.amount)) {
            // user balance - bet amount < 0
            user.invest = user.invest.plus(bet.amount).minus(user.balance);
          }

          user.balance = user.balance.plus(p_l).plus(user.invest).minus(oldInvest);
        }

        if (bet.position == roundPosition) {
          user.wholePayoutAmount = user.wholePayoutAmount.plus(p_l).plus(bet.amount);
        }

        user.wholeBetAmount = user.wholeBetAmount.plus(bet.amount);

        user.profit_lose = user.wholePayoutAmount.minus(user.wholeBetAmount);

        if (user.invest.gt(ZERO_BD)) {
          user.roi = user.profit_lose.div(user.invest);
        }

        user.save();
      }
    }
  }
}

export function handlePaused(event: PausedEvent): void {
  let market = Market.load(event.address.toHex());
  if (market == null) {
    log.error("Tried to pause market without an existing market (user: {}).", [event.params.account.toString()]);
    return;
  }
  market.paused = true;
  market.save();
}

export function handlePositionOpened(event: PositionOpenedEvent): void {
  let market = Market.load(event.address.toHex());
  if (market === null) {
    log.error("Tried query market with bet (bear)", []);
    return;
  }

  let decimals = SIX_BD;
  if (market.decimals == 6) {
    decimals = SIX_BD;
  } else if (market.decimals == 18) {
    decimals = EIGHTEEN_BD;
  } else {
    decimals = SIX_BD;
  }

  market.totalBets = market.totalBets.plus(ONE_BI);
  market.totalAmount = market.totalAmount.plus(event.params.amount.divDecimal(decimals));
  if (event.params.position == 0) {
    market.totalBetsBull = market.totalBetsBull.plus(ONE_BI);
    market.totalBullAmount = market.totalBullAmount.plus(event.params.amount.divDecimal(decimals));
  } else {
    market.totalBetsBear = market.totalBetsBear.plus(ONE_BI);
    market.totalBearAmount = market.totalBearAmount.plus(event.params.amount.divDecimal(decimals));
  }

  market.save();

  const roundId = generateRoundId(event.address, event.params.timeframeId, event.params.roundId);
  let round = Round.load(roundId);

  if (round === null) {
    log.warning("Tried ahead betting (epoch: {}). ", [event.params.roundId.toString()]);
    round = new Round(roundId);
    round.market = market.address.toHex();
    round.timeframeId = event.params.timeframeId;
    round.epoch = event.params.roundId;
    round.previous = event.params.roundId.equals(ZERO_BI) ? null : event.params.roundId.minus(ONE_BI).toString();

    // round.startAt = event.block.timestamp;
    // round.startBlock = event.block.number;
    // round.startHash = event.transaction.hash;

    round.totalBets = ZERO_BI;
    round.totalAmount = ZERO_BD;
    round.bullBets = ZERO_BI;
    round.bullAmount = ZERO_BD;
    round.bearBets = ZERO_BI;
    round.bearAmount = ZERO_BD;

    round.estimatedStartTime = getBlockTimeForEpoch(market.genesisStartTime, event.params.timeframeId, event.params.roundId);
    const duration = getDurationForTimeframeId(event.params.timeframeId);
    round.estimatedLockTime = round.estimatedStartTime.plus(duration);
    round.estimatedEndTime = round.estimatedLockTime.plus(duration);

  }
  round.totalBets = round.totalBets.plus(ONE_BI);
  round.totalAmount = round.totalAmount.plus(event.params.amount.divDecimal(decimals));

  if (event.params.position == 0) {
    round.bullBets = round.bullBets.plus(ONE_BI);
    round.bullAmount = round.bullAmount.plus(event.params.amount.divDecimal(decimals));
  } else {
    round.bearBets = round.bearBets.plus(ONE_BI);
    round.bearAmount = round.bearAmount.plus(event.params.amount.divDecimal(decimals));
  }
  round.save();

  // Fail safe condition in case the user has not been created yet.
  let user = User.load(event.params.user.toHex());
  if (user === null) {
    user = new User(event.params.user.toHex());
    user.address = event.params.user;
    user.address_string = event.params.user.toHexString();
    user.createdAt = event.block.timestamp;
    user.updatedAt = event.block.timestamp;
    user.block = event.block.number;
    user.wholeBetAmount = ZERO_BD;
    user.wholePayoutAmount = ZERO_BD;
    user.balance = ZERO_BD;
    user.invest = ZERO_BD;
    user.profit_lose = ZERO_BD;
    user.roi = ZERO_BD;
    market.totalUsers = market.totalUsers.plus(ONE_BI);
    market.save();
  }

  user.updatedAt = event.block.timestamp;
  user.save();

  let totalBetId = generateTotalBetId(event.address, event.params.timeframeId, event.params.user);
  let totalBet = TotalBet.load(totalBetId);

  if (totalBet === null) {
    totalBet = new TotalBet(totalBetId);
    totalBet.user = event.params.user.toHex();
    totalBet.count = ZERO_BI;
    totalBet.amount = ZERO_BD;
    totalBet.market = event.address;
    totalBet.timeframeId = event.params.timeframeId;
  }

  totalBet.count = totalBet.count.plus(ONE_BI);
  totalBet.amount = totalBet.amount.plus(event.params.amount.divDecimal(decimals));

  totalBet.save();

  const betId = genearteBetId(event.address, event.params.timeframeId, event.params.roundId, event.params.user);
  let bet = new Bet(betId);
  bet.market = market.address.toHex();
  bet.round = round.id;
  bet.user = user.id;
  bet.hash = event.transaction.hash;
  bet.timeframeId = event.params.timeframeId;
  bet.amount = event.params.amount.divDecimal(decimals);
  if (event.params.position == 0) {
    bet.position = "Bull";
  } else {
    bet.position = "Bear";
  }
  bet.claimed = false;
  bet.createdAt = event.block.timestamp;
  bet.updatedAt = event.block.timestamp;
  bet.block = event.block.number;
  bet.isReverted = false;
  bet.creditUsed = false;
  bet.save();
}

export function handleStartRound(event: StartRoundEvent): void {

  let market = Market.load(event.address.toHex());
  if (market === null) {
    market = new Market(event.address.toHex());
    market.epoch = event.params.epoch;
    market.paused = false;
    market.totalUsers = ZERO_BI;
    market.totalBets = ZERO_BI;
    market.totalBetsBull = ZERO_BI;
    market.totalBetsBear = ZERO_BI;
    market.address = event.address;
    market.totalAmount = ZERO_BD;
    market.totalBullAmount = ZERO_BD;
    market.totalBearAmount = ZERO_BD;
    market.genesisStartTime = ZERO_BI;
    market.save();
  }

  if (event.params.timeframeId == 0 && event.params.epoch.equals(ZERO_BI) && market.genesisStartTime.equals(BigInt.fromI32(0))) {
    market.genesisStartTime = event.params.startTime;
  }

  market.epoch = event.params.epoch;
  market.save();

  const roundId = generateRoundId(event.address, event.params.timeframeId, event.params.epoch);
  let round = Round.load(roundId);


  if (round === null) {
    round = new Round(roundId);
    round.market = market.address.toHex();
    round.timeframeId = event.params.timeframeId;
    round.epoch = event.params.epoch;
    round.previous = event.params.epoch.equals(ZERO_BI) ? null : event.params.epoch.minus(ONE_BI).toString();

    round.totalBets = ZERO_BI;
    round.totalAmount = ZERO_BD;
    round.bullBets = ZERO_BI;
    round.bullAmount = ZERO_BD;
    round.bearBets = ZERO_BI;
    round.bearAmount = ZERO_BD;

    round.estimatedStartTime = getBlockTimeForEpoch(market.genesisStartTime, event.params.timeframeId, event.params.epoch);
    const duration = getDurationForTimeframeId(event.params.timeframeId);
    round.estimatedLockTime = round.estimatedStartTime.plus(duration);
    round.estimatedEndTime = round.estimatedLockTime.plus(duration);

    round.save();
  }

  round.startAt = event.block.timestamp;
  round.startBlock = event.block.number;
  round.startHash = event.transaction.hash;

  round.save();
}


export function handleUnpaused(
  event: UnpausedEvent
): void {
  let market = Market.load(event.address.toHex());
  if (market == null) {
    log.error("Tried to unpause market without an existing market (user: {}).", [event.params.account.toString()]);
    return;
  }
  market.paused = false;
  market.save()
}

export function handleOracleChanged(
  event: OracleChangedEvent
): void {
  let market = Market.load(event.address.toHex());
  if (market == null) {
    log.error("Tried to change oracle of market without an existing market (user: {}).", [event.params.newOracle.toString()]);
    return;
  }
  // logic for updating oracle
}

export function handleMarketNameChanged(
  event: MarketNameChangedEvent
): void {

  let market = Market.load(event.address.toHex());
  if (market == null) {
    log.error("Tried to change market name of market without an existing market (user: {}).", [event.params.newName.toString()]);
    return;
  }

  market.name = event.params.newName;
  market.save();
}

export function handleAdminChanged(
  event: AdminChangedEvent
): void {
  // let market = Market.load(event.address.toHex());
  // if (market == null) {
  //   log.error("Tried to change market admin of market without an existing market (user: {}).", [event.params.newAdmin.toString()]);
  //   return;
  // }
  // market.save();
}

export function handleOperatorChanged(
  event: OperatorChangedEvent
): void {
  // let market = Market.load(event.address.toHex());
  // if (market == null) {
  //   log.error("Tried to change market operator of market without an existing market (user: {}).", [event.params.newOperator.toString()]);
  //   return;
  // }

  // market.operator = event.params.newOperator;
  // market.save();
}

export function handleBetReverted(
  event: BetRevertedEvent
): void {
  const revertedUsers = event.params.users;
  const timeframeId = event.params.timeframeId;
  const epoch = event.params.epoch;

  let flag: boolean = false;
  let position: string = 'Bull';
  let revertedAmount: BigDecimal = ZERO_BD;
  let revertedCount: BigInt = ZERO_BI;

  for (let i = 0; i < revertedUsers.length; i++) {
    const user = revertedUsers[i];
    const betId = genearteBetId(event.address, timeframeId, epoch, user);
    const bet = Bet.load(betId);
    if (bet === null) {
      log.warning("None exist reverted bet (user: {}). ", [user.toString()]);
      continue;
    }
    bet.isReverted = true;
    bet.save();

    revertUserBets(event.address, timeframeId, user, bet.amount);

    if (!flag) {
      position = bet.position;
      flag = true;
    }
    revertedAmount = revertedAmount.plus(bet.amount);
    revertedCount = revertedCount.plus(ONE_BI);
  }

  revertRoundBets(event.address, timeframeId, epoch, position, revertedAmount, revertedCount);
}



function revertUserBets(marketAddress: Address, timeframeId: number, user: Address, revertedAmount: BigDecimal): void {
  const totalBetId = generateTotalBetId(marketAddress, timeframeId, user);
  const totalBet = TotalBet.load(totalBetId);

  if (totalBet === null) {
    log.warning("None exist Total Bet (user: {}). ", [user.toString()]);
  } else {
    totalBet.amount = totalBet.amount.minus(revertedAmount);
    totalBet.count = totalBet.count.minus(ONE_BI);
    totalBet.save();
  }
}

function revertRoundBets(marketAddress: Address, timeframeId: number, epoch: BigInt, position: string, revertedAmount: BigDecimal, revertedCount: BigInt): void {
  const roundId = generateRoundId(marketAddress, timeframeId, epoch);
  const round = Round.load(roundId);
  if (round === null) {
    log.warning("None exist round (round: {}). ", [epoch.toString()]);
  } else {
    round.totalBets = round.totalBets.minus(revertedCount);
    round.totalAmount = round.totalAmount.minus(revertedAmount);
    if (position == 'Bull') {
      round.bullBets = round.bullBets.minus(revertedCount);
      round.bullAmount = round.bullAmount.minus(revertedAmount);
    } else {
      round.bearBets = round.bearBets.minus(revertedCount);
      round.bearAmount = round.bearAmount.minus(revertedAmount);
    }
    round.save();
  }

  const market = Market.load(marketAddress.toHex());
  if (market === null) {
    log.warning("Tried query null market", []);
  } else {
    market.totalBets = market.totalBets.minus(revertedCount);
    market.totalAmount = market.totalAmount.minus(revertedAmount);
    if (position == 'Bull') {
      market.totalBetsBull = market.totalBetsBull.minus(revertedCount);
      market.totalBullAmount = market.totalBullAmount.minus(revertedAmount);
    } else {
      market.totalBetsBear = market.totalBetsBear.minus(revertedCount);
      market.totalBearAmount = market.totalBearAmount.minus(revertedAmount);
    }
    market.save();
  }
}

export function handleGenesisStartTimeSet(event: GenesisStartTimeSet): void {
  let market = Market.load(event.address.toHex());
  if (!market) {
    log.error("Tried to set market genesis start time without an existing market (user: {}).", [event.address.toHex()]);
    return;
  }
  market.genesisStartTime = event.params.newTime;
  market.save();
}

export function handlePositionOpenedCredit(event: PositionOpenedEventCredit): void {
  let legacyEvent = new PositionOpenedEvent(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    event.parameters,
    event.receipt
  )
  handlePositionOpened(legacyEvent);

  const betId = genearteBetId(event.address, event.params.timeframeId, event.params.roundId, event.params.user);
  const bet = Bet.load(betId);
  if (bet) {
    bet.creditUsed = event.params.creditUsed;
    bet.save();
  }

}