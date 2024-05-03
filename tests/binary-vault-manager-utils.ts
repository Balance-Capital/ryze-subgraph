import { newMockEvent } from "matchstick-as"
import { ethereum, Address } from "@graphprotocol/graph-ts"
import {
  NewVaultCreated,
  BinaryVaultManagerOwnershipTransferred
} from "../generated/BinaryVaultManager/BinaryVaultManager"

export function createNewVaultCreatedEvent(
  vault: Address,
  underlyingToken: Address
): NewVaultCreated {
  let newVaultCreatedEvent = changetype<NewVaultCreated>(newMockEvent())

  newVaultCreatedEvent.parameters = new Array()

  newVaultCreatedEvent.parameters.push(
    new ethereum.EventParam("vault", ethereum.Value.fromAddress(vault))
  )
  newVaultCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "underlyingToken",
      ethereum.Value.fromAddress(underlyingToken)
    )
  )

  return newVaultCreatedEvent
}

export function createBinaryVaultManagerOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): BinaryVaultManagerOwnershipTransferred {
  let binaryVaultManagerOwnershipTransferredEvent = changetype<
    BinaryVaultManagerOwnershipTransferred
  >(newMockEvent())

  binaryVaultManagerOwnershipTransferredEvent.parameters = new Array()

  binaryVaultManagerOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  binaryVaultManagerOwnershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return binaryVaultManagerOwnershipTransferredEvent
}
