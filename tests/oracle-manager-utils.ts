import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  OracleAdded,
  OracleManagerOwnershipTransferred
} from "../generated/OracleManager/OracleManager"

export function createOracleAddedEvent(
  marketId: BigInt,
  oracle: Address
): OracleAdded {
  let oracleAddedEvent = changetype<OracleAdded>(newMockEvent())

  oracleAddedEvent.parameters = new Array()

  oracleAddedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  oracleAddedEvent.parameters.push(
    new ethereum.EventParam("oracle", ethereum.Value.fromAddress(oracle))
  )

  return oracleAddedEvent
}

export function createOracleManagerOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OracleManagerOwnershipTransferred {
  let oracleManagerOwnershipTransferredEvent = changetype<
    OracleManagerOwnershipTransferred
  >(newMockEvent())

  oracleManagerOwnershipTransferredEvent.parameters = new Array()

  oracleManagerOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  oracleManagerOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return oracleManagerOwnershipTransferredEvent
}
