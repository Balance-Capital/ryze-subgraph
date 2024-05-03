import { BigDecimal, log } from "@graphprotocol/graph-ts";
import {
  Vault,
  VaultActivity,
  VaultPosition,
  VaultSnapshot,
  Withdrawal,
} from "../generated/schema";
import {
  Transfer as TransferEvent,
  LiquidityAdded as LiquidityAddedEvent,
  PositionMerged as PositionMergedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
  OwnershipTransferred as AdminChangedEvent,
  ConfigChanged as ConfigChangedEvent,
  WhitelistMarketChanged as WhitelistMarketChangedEvent,
  WithdrawalRequested as WithdrawalRequestedEvent,
  WithdrawalRequestCanceled as WithdrawalRequestCanceledEvent,
  VaultChangedFromMarket as VaultChangedFromMarketEvent,
  BinaryVault,
  ManagementFeeWithdrawed as ManagementFeeWithdrawedEvent,
  LiquidityAdded1 as OldLiquidityAddedEvent,
  LiquidityRemoved1 as OldLiquidityRemovedEvent,
  PositionMerged1 as OldPositionMergedEvent,
  WithdrawalRequested1 as OldWithdrawalRequestedEvent
} from "../generated/templates/BinaryVault/BinaryVault";
import { EIGHTEEN_BD, ZERO_ADDRESS, ZERO_BD, ZERO_BI, SIX_BD } from "./constants";
import {
  generateVaultActivityId,
  generateVaultPositionId,
  generateVaultSnapshotId,
  generateWithdrawalId,
} from "./helpers";
import { store } from "@graphprotocol/graph-ts";

export function handleLiquidityAdded(event: OldLiquidityAddedEvent): void {
  let vault = Vault.load(event.address.toHex());
  if (vault == null) {
    vault = new Vault(event.address.toHex());
    vault.address = event.address;
    vault.totalStakedAmount = ZERO_BD;
    vault.totalShares = ZERO_BD;
    vault.feeAccrued = ZERO_BD;
    vault.tokenIds = [];
    vault.adminAddress = event.transaction.from;
  }

  let decimals = SIX_BD;
  if (vault.decimals == 6) {
    decimals = decimals;
  } else if (vault.decimals == 18) {
    decimals = EIGHTEEN_BD;
  } else {
    decimals = decimals;
  }

  vault.totalShares = vault.totalShares.plus(
    event.params.newShareAmount.divDecimal(decimals)
  );
  vault.totalStakedAmount = vault.totalStakedAmount.plus(
    event.params.amount.divDecimal(decimals)
  );
  vault.totalInvestedAmount = vault.totalInvestedAmount.plus(
    event.params.amount.divDecimal(decimals)
  );
  vault.save();

  let tokenIds = vault.tokenIds;
  tokenIds.push(event.params.newTokenId);

  if (event.params.newTokenId.equals(event.params.oldTokenId)) {
    // New liquidity added
    // Create Vault Position
    let vaultPositionId = generateVaultPositionId(
      event.address,
      event.params.newTokenId
    );
    let vaultPosition = new VaultPosition(vaultPositionId);
    vaultPosition.vault = event.address.toHex();
    vaultPosition.tokenId = event.params.newTokenId;
    vaultPosition.investAmount = event.params.amount.divDecimal(decimals);
    vaultPosition.shareAmount = event.params.newShareAmount.divDecimal(decimals);
    vaultPosition.owner = event.params.user;
    vaultPosition.timestamp = event.block.timestamp;
    vaultPosition.save();
  } else {
    if (tokenIds.indexOf(event.params.oldTokenId) > -1)
      tokenIds.splice(tokenIds.indexOf(event.params.oldTokenId), 1);

    // Burn existing position, mint new one
    let oldVaultPositionId = generateVaultPositionId(
      event.address,
      event.params.oldTokenId
    );
    let oldVaultPosition = VaultPosition.load(oldVaultPositionId);

    if (oldVaultPosition === null) {
      log.error(
        "Tried to read non existing vault position (position id: {}).",
        [event.params.oldTokenId.toHex()]
      );
      return;
    }

    let currentTokenAmount = oldVaultPosition.investAmount;
    let currentShareAmount = oldVaultPosition.shareAmount;

    let newVaultPositionId = generateVaultPositionId(
      event.address,
      event.params.newTokenId
    );
    let vaultPosition = new VaultPosition(newVaultPositionId);
    vaultPosition.vault = event.address.toHex();
    vaultPosition.tokenId = event.params.newTokenId;
    vaultPosition.investAmount = currentTokenAmount.plus(
      event.params.amount.divDecimal(decimals)
    );
    vaultPosition.shareAmount = currentShareAmount.plus(
      event.params.newShareAmount.divDecimal(decimals)
    );
    vaultPosition.owner = event.params.user;
    vaultPosition.timestamp = event.block.timestamp;
    vaultPosition.save();

    store.remove("VaultPosition", oldVaultPositionId);
  }
  vault.tokenIds = tokenIds;
  vault.save();

  // Create snapshot
  let snapshotId = generateVaultSnapshotId(
    event.address,
    event.block.timestamp,
    event.block.hash,
    event.logIndex
  );
  let snapShot = new VaultSnapshot(snapshotId);
  snapShot.vault = event.address.toHex();
  snapShot.timestamp = event.block.timestamp;
  snapShot.totalStakedAmount = vault.totalStakedAmount;
  snapShot.totalShares = vault.totalShares;
  snapShot.totalInvestedAmount = vault.totalInvestedAmount;
  snapShot.save();

  // Create VaultActivity
  let activityId = generateVaultActivityId(
    event.address,
    event.block.timestamp,
    event.block.hash,
    event.logIndex
  );

  let activity = new VaultActivity(activityId);
  activity.account = event.params.user;
  activity.amount = event.params.amount.divDecimal(decimals);
  activity.vault = event.address.toHex();
  activity.timestamp = event.block.timestamp;
  activity.type = "Deposit";
  activity.save();
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  let vault = Vault.load(event.address.toHex());
  if (vault == null) {
    vault = new Vault(event.address.toHex());
    vault.address = event.address;
    vault.totalStakedAmount = ZERO_BD;
    vault.totalShares = ZERO_BD;
    vault.feeAccrued = ZERO_BD;
    vault.tokenIds = [];
    vault.adminAddress = event.transaction.from;
  }

  let decimals = SIX_BD;
  if (vault.decimals == 6) {
    decimals = decimals;
  } else if (vault.decimals == 18) {
    decimals = EIGHTEEN_BD;
  } else {
    decimals = decimals;
  }

  let amountWithFee = event.params.amount
    .plus(event.params.fee)
    .divDecimal(decimals);

  vault.totalShares = vault.totalShares.minus(
    event.params.shareAmount.divDecimal(decimals)
  );

  vault.totalStakedAmount = vault.totalStakedAmount.minus(amountWithFee);

  let tokenIds = vault.tokenIds;
  if (tokenIds.indexOf(event.params.tokenId) > -1)
    tokenIds.splice(tokenIds.indexOf(event.params.tokenId), 1);

  // Remove old vault position, mint new one if there is some dust.
  let tokenId = event.params.tokenId;
  let oldVaultPositionId = generateVaultPositionId(event.address, tokenId);
  let oldVaultPosition = VaultPosition.load(oldVaultPositionId);

  if (oldVaultPosition === null) {
    log.error("Tried to read non existing vault position (position id: {}).", [
      tokenId.toHex(),
    ]);
    vault.tokenIds = tokenIds;
    vault.save();
    return;
  }

  let withdrawedInvestment = ZERO_BD;
  if (event.params.newShares.gt(ZERO_BI)) {
    tokenIds.push(event.params.newTokenId);

    // Some dust - Mint new one
    let currentTokenAmount = oldVaultPosition.investAmount;
    let currentShareAmount = oldVaultPosition.shareAmount;

    let newVaultPositionId = generateVaultPositionId(
      event.address,
      event.params.newTokenId
    );

    let vaultPosition = new VaultPosition(newVaultPositionId);
    vaultPosition.vault = event.address.toHex();
    vaultPosition.tokenId = event.params.newTokenId;
    let vaultContract = BinaryVault.bind(event.address);

    vault.totalInvestedAmount = vault.totalInvestedAmount.minus(currentTokenAmount).plus(vaultPosition.investAmount);

    vaultPosition.shareAmount = event.params.newShares.divDecimal(decimals);
    vaultPosition.owner = event.params.user;
    vaultPosition.timestamp = event.block.timestamp;
    vaultPosition.save();

    withdrawedInvestment = currentTokenAmount.minus(vaultPosition.investAmount);
  } else {
    // Withdrawed total
    withdrawedInvestment = oldVaultPosition.investAmount;
  }
  vault.tokenIds = tokenIds;
  vault.save();

  store.remove("VaultPosition", oldVaultPositionId);

  // Create snapshot
  let snapshotId = generateVaultSnapshotId(
    event.address,
    event.block.timestamp,
    event.block.hash,
    event.logIndex
  );
  let snapshot = new VaultSnapshot(snapshotId);
  snapshot.vault = event.address.toHex();
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalStakedAmount = vault.totalStakedAmount;
  snapshot.totalInvestedAmount = vault.totalInvestedAmount;
  snapshot.totalShares = vault.totalShares;
  snapshot.managementFee = event.params.fee.divDecimal(decimals);
  snapshot.save();

  // Create VaultActivity
  let activityId = generateVaultActivityId(
    event.address,
    event.block.timestamp,
    event.block.hash,
    event.logIndex
  );

  let activity = new VaultActivity(activityId);
  activity.account = event.params.user;
  activity.amount = event.params.amount.divDecimal(decimals);
  activity.vault = event.address.toHex();
  activity.timestamp = event.block.timestamp;
  activity.type = "Withdraw";
  activity.save();

  let id = generateWithdrawalId(event.address, event.params.tokenId);
  let withdrawal = Withdrawal.load(id);
  if (withdrawal === null) {
    log.error("Tried to read non existing withdrawal (position id: {}).", [
      tokenId.toHex(),
    ]);
    return;
  }
  store.remove("Withdrawal", id);
}

export function handleTransfer(event: TransferEvent): void {
  let vaultPositionId = generateVaultPositionId(
    event.address,
    event.params.tokenId
  );

  let vaultPosition = VaultPosition.load(vaultPositionId);

  if (vaultPosition == null) {
    log.warning(
      "Tried to read non existing vault position - Transfer. (position id: {})",
      [event.params.tokenId.toHex()]
    );
    return;
  }

  if (event.params.to.toHex() === ZERO_ADDRESS) {
    // Burn action
    // store.remove('VaultPosition', vaultPositionId);
  } else if (event.params.from.toHex() === ZERO_ADDRESS) {
    // Mint action
  } else {
    // Transfer ownership of this position
    vaultPosition.owner = event.params.to;
    vaultPosition.save();
  }
}

export function handlePositionMerged(event: OldPositionMergedEvent): void {
  let ids = event.params.tokenIds;
  let newVaultPositionId = generateVaultPositionId(
    event.address,
    event.params.newTokenId
  );
  let newVaultPosition = new VaultPosition(newVaultPositionId);
  let vault = Vault.load(event.address.toHex());
  if (vault === null) return;

  let tokenIds = vault.tokenIds;
  tokenIds.push(event.params.newTokenId);

  let totalInvestments = ZERO_BD;
  let totalShares = ZERO_BD;
  for (let i = 0; i < ids.length; i++) {
    let positionId = generateVaultPositionId(event.address, ids[i]);
    let vaultPosition = VaultPosition.load(positionId);
    if (vaultPosition === null) {
      log.warning("Tried to read values from non existing vault position: {}", [
        ids[i].toHex(),
      ]);
    } else {
      if (tokenIds.indexOf(ids[i]) > -1)
        tokenIds.splice(tokenIds.indexOf(ids[i]), 1);
      totalInvestments = totalInvestments.plus(vaultPosition.investAmount);
      totalShares = totalShares.plus(vaultPosition.shareAmount);
      store.remove("VaultPosition", positionId);
    }
  }
  vault.tokenIds = tokenIds;
  vault.save();

  newVaultPosition.vault = event.address.toHex();
  newVaultPosition.tokenId = event.params.newTokenId;
  newVaultPosition.owner = event.params.user;
  newVaultPosition.investAmount = totalInvestments;
  newVaultPosition.shareAmount = totalShares;
  newVaultPosition.timestamp = event.block.timestamp;
  newVaultPosition.save();
}

export function handleWhitelistMarketChanged(
  event: WhitelistMarketChangedEvent
): void {
  // TODO
}

export function handleAdminChanged(event: AdminChangedEvent): void {
  let vault = Vault.load(event.address.toHex());
  if (vault == null) {
    vault = new Vault(event.address.toHex());
    vault.address = event.address;
    vault.totalStakedAmount = ZERO_BD;
    vault.totalShares = ZERO_BD;
    vault.feeAccrued = ZERO_BD;
    vault.tokenIds = [];
    vault.adminAddress = event.transaction.from;
  }
  vault.adminAddress = event.params.newOwner;
  vault.save();
}

export function handleConfigChanged(event: ConfigChangedEvent): void {
  let vault = Vault.load(event.address.toHex());
  if (vault == null) {
    vault = new Vault(event.address.toHex());
    vault.address = event.address;
    vault.totalStakedAmount = ZERO_BD;
    vault.totalShares = ZERO_BD;
    vault.feeAccrued = ZERO_BD;
    vault.tokenIds = [];
    vault.adminAddress = event.transaction.from;
  }
  vault.config = event.params.config;
  vault.save();
}

export function handleWithdrawalRequest(event: OldWithdrawalRequestedEvent): void {
  let id = generateWithdrawalId(event.address, event.params.tokenId);
  let withdrawal = Withdrawal.load(id);
  if (withdrawal === null) {
    withdrawal = new Withdrawal(id);
    withdrawal.vault = event.address.toHex();
    withdrawal.tokenId = event.params.tokenId;
  }
  let vault = Vault.load(event.address.toHex());
  if (vault == null) {
    vault = new Vault(event.address.toHex());
    vault.address = event.address;
    vault.totalStakedAmount = ZERO_BD;
    vault.totalShares = ZERO_BD;
    vault.feeAccrued = ZERO_BD;
    vault.tokenIds = [];
    vault.adminAddress = event.transaction.from;
    vault.decimals = 6;
  }

  let decimals = SIX_BD;
  if (vault.decimals == 6) {
    decimals = decimals;
  } else if (vault.decimals == 18) {
    decimals = EIGHTEEN_BD;
  } else {
    decimals = decimals;
  }

  withdrawal.shareAmount = event.params.shareAmount.divDecimal(decimals);
  withdrawal.startTime = event.block.timestamp;
  withdrawal.state = "PENDING";

  let contract = BinaryVault.bind(event.address);
  let request = contract.withdrawalRequests(event.params.tokenId);
  withdrawal.feeAmount = request.fee.divDecimal(decimals);

  withdrawal.save();

  let vaultPositionId = generateVaultPositionId(
    event.address,
    event.params.tokenId
  );
  let vaultPosition = VaultPosition.load(vaultPositionId);
  if (vaultPosition === null) {
    log.error("Tried to read non existing vault position (position id: {}).", [
      event.params.tokenId.toHex(),
    ]);
    return;
  }

  vaultPosition.withdrawal = id;
  vaultPosition.save();
}

export function handleWithdrawalRequestCanceled(
  event: WithdrawalRequestCanceledEvent
): void {
  let id = generateWithdrawalId(event.address, event.params.tokenId);
  let withdrawal = Withdrawal.load(id);
  if (withdrawal === null) {
    log.error(
      "Tried to read non existing vault position request(position id: {}).",
      [event.params.tokenId.toHex()]
    );
    return;
  }
  store.remove("Withdrawal", id);
}

export function handleVaultChangedFromMarket(
  event: VaultChangedFromMarketEvent
): void {
  let id = generateVaultSnapshotId(
    event.address,
    event.block.timestamp,
    event.block.hash,
    event.logIndex
  );
  let vault = Vault.load(event.address.toHex());

  if (vault === null) {
    log.error("Tried to read non existing vault. {}", [event.address.toHex()]);
    return;
  }

  let decimals = SIX_BD;
  if (vault.decimals == 6) {
    decimals = decimals;
  } else if (vault.decimals == 18) {
    decimals = EIGHTEEN_BD;
  } else {
    decimals = decimals;
  }

  vault.totalStakedAmount = event.params.totalDepositedAmount.divDecimal(
    decimals
  );
  vault.save();

  let vaultSnapshot = new VaultSnapshot(id);
  vaultSnapshot.vault = event.address.toHex();
  vaultSnapshot.timestamp = event.block.timestamp;
  vaultSnapshot.totalStakedAmount = event.params.totalDepositedAmount.divDecimal(
    decimals
  );
  vaultSnapshot.totalShares = vault.getBigDecimal("totalShares");
  vaultSnapshot.totalInvestedAmount = vault.totalInvestedAmount;
  vaultSnapshot.save();
}

export function handleManagementFeeWithdrawed(
  event: ManagementFeeWithdrawedEvent
): void {
  let vault = Vault.load(event.address.toHex());

  if (vault === null) {
    log.error("Tried to read non existing vault. {}", [event.address.toHex()]);
    return;
  }
  let decimals = SIX_BD;
  if (vault.decimals == 6) {
    decimals = decimals;
  } else if (vault.decimals == 18) {
    decimals = EIGHTEEN_BD;
  } else {
    decimals = decimals;
  }
  const vaultContract = BinaryVault.bind(event.address);
  vault.totalShares = vaultContract.totalShareSupply().divDecimal(decimals);
  vault.totalStakedAmount = vaultContract.totalDepositedAmount().divDecimal(decimals);

  vault.save();

  let snapshotId = generateVaultSnapshotId(
    event.address,
    event.block.timestamp,
    event.block.hash,
    event.logIndex
  );
  let snapshot = new VaultSnapshot(snapshotId);
  snapshot.vault = event.address.toHex();
  snapshot.timestamp = event.block.timestamp;
  snapshot.totalStakedAmount = vault.totalStakedAmount;
  snapshot.totalShares = vault.totalShares;
  snapshot.totalInvestedAmount = vault.totalInvestedAmount;
  snapshot.save();
}
