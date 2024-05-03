import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OracleOwnershipTransferred,
  WriterUpdated,
  WrotePrice
} from "../generated/Oracle/Oracle"

export function createOracleOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OracleOwnershipTransferred {
  let oracleOwnershipTransferredEvent = changetype<OracleOwnershipTransferred>(
    newMockEvent()
  )

  oracleOwnershipTransferredEvent.parameters = new Array()

  oracleOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  oracleOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return oracleOwnershipTransferredEvent
}

export function createWriterUpdatedEvent(
  writer: Address,
  enabled: boolean
): WriterUpdated {
  let writerUpdatedEvent = changetype<WriterUpdated>(newMockEvent())

  writerUpdatedEvent.parameters = new Array()

  writerUpdatedEvent.parameters.push(
    new ethereum.EventParam("writer", ethereum.Value.fromAddress(writer))
  )
  writerUpdatedEvent.parameters.push(
    new ethereum.EventParam("enabled", ethereum.Value.fromBoolean(enabled))
  )

  return writerUpdatedEvent
}

export function createWrotePriceEvent(
  writer: Address,
  roundId: BigInt,
  timestamp: BigInt,
  price: BigInt
): WrotePrice {
  let wrotePriceEvent = changetype<WrotePrice>(newMockEvent())

  wrotePriceEvent.parameters = new Array()

  wrotePriceEvent.parameters.push(
    new ethereum.EventParam("writer", ethereum.Value.fromAddress(writer))
  )
  wrotePriceEvent.parameters.push(
    new ethereum.EventParam(
      "roundId",
      ethereum.Value.fromUnsignedBigInt(roundId)
    )
  )
  wrotePriceEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )
  wrotePriceEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return wrotePriceEvent
}
