import { Address, BigInt, ByteArray, Bytes, ethereum } from "@graphprotocol/graph-ts";

export const generateRoundId = (marketAddress: Address, timeframeId: number, epoch: BigInt): string => {
    return marketAddress.toHex() + '/' + timeframeId.toString(0) + '/' + epoch.toHex();
}

export const genearteBetId = (marketAddress: Address, timeframeId: number, epoch: BigInt, owner: Address): string => {
    return marketAddress.toHex() + '/' + timeframeId.toString(0) + '/' + epoch.toHex() + '/' + owner.toHex();
}

export const generatePayoutId = (marketAddress: Address, user: Address): string => {
    return marketAddress.toHex() + '/' + user.toHex();
}

export const generateTotalBetId = (marketAddress: Address, timeframeId: number, user: Address): string => {
    return marketAddress.toHex() + '/' + timeframeId.toString(0) + '/'  + user.toHex();
}

export const generateWinBetId = (marketAddress: Address, user: Address): string => {
    return marketAddress.toHex() + '/' + user.toHex();
}

export function genericId(event: ethereum.Event): string {
    return event.transaction.hash.toHex() + '/' + event.logIndex.toString();
}

export function getDurationForTimeframeId(timeframeId: number): BigInt {
    if (timeframeId === 0) {
        return BigInt.fromI32(60);
    } else if (timeframeId === 1) {
        return BigInt.fromI32(300);
    } else if (timeframeId === 2) {
        return BigInt.fromI32(900);
    } else if (timeframeId === 3) {
        return BigInt.fromI32(180);
    }

    return BigInt.fromI32(60);
}

export const generateVaultPositionId = (vaultAddress: Address, id: BigInt): string => {
    return vaultAddress.toHex() + '/' + id.toHex();
}

export const generateWithdrawalId = (vaultAddress: Address, id: BigInt): string => {
    return vaultAddress.toHex() + '/' + id.toHex();
}

export const generateVaultSnapshotId = (vaultAddress: Address, timestamp: BigInt, hash: Bytes, logIndex: BigInt): string => {
    return vaultAddress.toHex() + '/' + timestamp.toHex() + '/' + hash.toHex() + '/' + logIndex.toHex();
}

export const generateVaultActivityId = (vaultAddress: Address, timestamp: BigInt, hash: Bytes, logIndex: BigInt): string => {
    return "activity_" + '_' + vaultAddress.toHex() + '/' + timestamp.toHex() + '/' + hash.toHex() + '/' + logIndex.toHex();
}

export const getBlockTimeForEpoch = (genesisStartTime: BigInt, timeframeId: number, epoch: BigInt): BigInt => {
    const duration = getDurationForTimeframeId(timeframeId);
    return genesisStartTime.plus(epoch.times(duration));
}