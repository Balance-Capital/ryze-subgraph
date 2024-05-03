import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address } from "@graphprotocol/graph-ts"
import { NewVaultCreated } from "../generated/schema"
import { NewVaultCreated as NewVaultCreatedEvent } from "../generated/BinaryVaultManager/BinaryVaultManager"
import { handleNewVaultCreated } from "../src/binary-vault-manager"
import { createNewVaultCreatedEvent } from "./binary-vault-manager-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let vault = Address.fromString("0x0000000000000000000000000000000000000001")
    let underlyingToken = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newNewVaultCreatedEvent = createNewVaultCreatedEvent(
      vault,
      underlyingToken
    )
    handleNewVaultCreated(newNewVaultCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("NewVaultCreated created and stored", () => {
    assert.entityCount("NewVaultCreated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "NewVaultCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "vault",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "NewVaultCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "underlyingToken",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
