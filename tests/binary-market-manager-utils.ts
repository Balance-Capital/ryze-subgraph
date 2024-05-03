import { newMockEvent } from "matchstick-as"
import { ethereum, Address } from "@graphprotocol/graph-ts"
import {
  MarketCreated,
  BinaryMarketManagerOwnershipTransferred
} from "../generated/BinaryMarketManager/BinaryMarketManager"

export function createMarketCreatedEvent(
  market: Address,
  creator: Address
): MarketCreated {
  let marketCreatedEvent = changetype<MarketCreated>(newMockEvent())

  marketCreatedEvent.parameters = new Array()

  marketCreatedEvent.parameters.push(
    new ethereum.EventParam("market", ethereum.Value.fromAddress(market))
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )

  return marketCreatedEvent
}

export function createBinaryMarketManagerOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): BinaryMarketManagerOwnershipTransferred {
  let binaryMarketManagerOwnershipTransferredEvent = changetype<
    BinaryMarketManagerOwnershipTransferred
  >(newMockEvent())

  binaryMarketManagerOwnershipTransferredEvent.parameters = new Array()

  binaryMarketManagerOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  binaryMarketManagerOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return binaryMarketManagerOwnershipTransferredEvent
}
