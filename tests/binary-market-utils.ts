import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  BinaryMarketClaimed,
  EndRound,
  LockRound,
  BinaryMarketPaused,
  PositionOpened,
  StartRound,
  BinaryMarketUnpaused
} from "../generated/BinaryMarket/BinaryMarket"

export function createBinaryMarketClaimedEvent(
  marketName: string,
  user: Address,
  timeframeId: BigInt,
  roundId: BigInt,
  amount: BigInt
): BinaryMarketClaimed {
  let binaryMarketClaimedEvent = changetype<BinaryMarketClaimed>(newMockEvent())

  binaryMarketClaimedEvent.parameters = new Array()

  binaryMarketClaimedEvent.parameters.push(
    new ethereum.EventParam("marketName", ethereum.Value.fromString(marketName))
  )
  binaryMarketClaimedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  binaryMarketClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "timeframeId",
      ethereum.Value.fromUnsignedBigInt(timeframeId)
    )
  )
  binaryMarketClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "roundId",
      ethereum.Value.fromUnsignedBigInt(roundId)
    )
  )
  binaryMarketClaimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return binaryMarketClaimedEvent
}

export function createEndRoundEvent(
  timeframeId: i32,
  epoch: BigInt,
  oracleRoundId: BigInt,
  price: BigInt
): EndRound {
  let endRoundEvent = changetype<EndRound>(newMockEvent())

  endRoundEvent.parameters = new Array()

  endRoundEvent.parameters.push(
    new ethereum.EventParam(
      "timeframeId",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(timeframeId))
    )
  )
  endRoundEvent.parameters.push(
    new ethereum.EventParam("epoch", ethereum.Value.fromUnsignedBigInt(epoch))
  )
  endRoundEvent.parameters.push(
    new ethereum.EventParam(
      "oracleRoundId",
      ethereum.Value.fromUnsignedBigInt(oracleRoundId)
    )
  )
  endRoundEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return endRoundEvent
}

export function createLockRoundEvent(
  timeframeId: i32,
  epoch: BigInt,
  oracleRoundId: BigInt,
  price: BigInt
): LockRound {
  let lockRoundEvent = changetype<LockRound>(newMockEvent())

  lockRoundEvent.parameters = new Array()

  lockRoundEvent.parameters.push(
    new ethereum.EventParam(
      "timeframeId",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(timeframeId))
    )
  )
  lockRoundEvent.parameters.push(
    new ethereum.EventParam("epoch", ethereum.Value.fromUnsignedBigInt(epoch))
  )
  lockRoundEvent.parameters.push(
    new ethereum.EventParam(
      "oracleRoundId",
      ethereum.Value.fromUnsignedBigInt(oracleRoundId)
    )
  )
  lockRoundEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return lockRoundEvent
}

export function createBinaryMarketPausedEvent(
  account: Address
): BinaryMarketPaused {
  let binaryMarketPausedEvent = changetype<BinaryMarketPaused>(newMockEvent())

  binaryMarketPausedEvent.parameters = new Array()

  binaryMarketPausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return binaryMarketPausedEvent
}

export function createPositionOpenedEvent(
  marketName: string,
  user: Address,
  amount: BigInt,
  timeframeId: BigInt,
  roundId: BigInt,
  position: i32
): PositionOpened {
  let positionOpenedEvent = changetype<PositionOpened>(newMockEvent())

  positionOpenedEvent.parameters = new Array()

  positionOpenedEvent.parameters.push(
    new ethereum.EventParam("marketName", ethereum.Value.fromString(marketName))
  )
  positionOpenedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  positionOpenedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  positionOpenedEvent.parameters.push(
    new ethereum.EventParam(
      "timeframeId",
      ethereum.Value.fromUnsignedBigInt(timeframeId)
    )
  )
  positionOpenedEvent.parameters.push(
    new ethereum.EventParam(
      "roundId",
      ethereum.Value.fromUnsignedBigInt(roundId)
    )
  )
  positionOpenedEvent.parameters.push(
    new ethereum.EventParam(
      "position",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(position))
    )
  )

  return positionOpenedEvent
}

export function createStartRoundEvent(
  timeframeId: i32,
  epoch: BigInt
): StartRound {
  let startRoundEvent = changetype<StartRound>(newMockEvent())

  startRoundEvent.parameters = new Array()

  startRoundEvent.parameters.push(
    new ethereum.EventParam(
      "timeframeId",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(timeframeId))
    )
  )
  startRoundEvent.parameters.push(
    new ethereum.EventParam("epoch", ethereum.Value.fromUnsignedBigInt(epoch))
  )

  return startRoundEvent
}

export function createBinaryMarketUnpausedEvent(
  account: Address
): BinaryMarketUnpaused {
  let binaryMarketUnpausedEvent = changetype<BinaryMarketUnpaused>(
    newMockEvent()
  )

  binaryMarketUnpausedEvent.parameters = new Array()

  binaryMarketUnpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return binaryMarketUnpausedEvent
}
