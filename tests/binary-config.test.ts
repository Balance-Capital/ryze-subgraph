import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address } from "@graphprotocol/graph-ts"
import { BinaryConfigInitialized } from "../generated/schema"
import { BinaryConfigInitialized as BinaryConfigInitializedEvent } from "../generated/BinaryConfig/BinaryConfig"
import { handleBinaryConfigInitialized } from "../src/binary-config"
import { createBinaryConfigInitializedEvent } from "./binary-config-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let version = 123
    let newBinaryConfigInitializedEvent = createBinaryConfigInitializedEvent(
      version
    )
    handleBinaryConfigInitialized(newBinaryConfigInitializedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("BinaryConfigInitialized created and stored", () => {
    assert.entityCount("BinaryConfigInitialized", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BinaryConfigInitialized",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "version",
      "123"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
