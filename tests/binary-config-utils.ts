import { newMockEvent } from "matchstick-as"
import { ethereum, Address } from "@graphprotocol/graph-ts"
import {
  BinaryConfigInitialized,
  BinaryConfigOwnershipTransferred
} from "../generated/BinaryConfig/BinaryConfig"

export function createBinaryConfigInitializedEvent(
  version: i32
): BinaryConfigInitialized {
  let binaryConfigInitializedEvent = changetype<BinaryConfigInitialized>(
    newMockEvent()
  )

  binaryConfigInitializedEvent.parameters = new Array()

  binaryConfigInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(version))
    )
  )

  return binaryConfigInitializedEvent
}

export function createBinaryConfigOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): BinaryConfigOwnershipTransferred {
  let binaryConfigOwnershipTransferredEvent = changetype<
    BinaryConfigOwnershipTransferred
  >(newMockEvent())

  binaryConfigOwnershipTransferredEvent.parameters = new Array()

  binaryConfigOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  binaryConfigOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return binaryConfigOwnershipTransferredEvent
}
