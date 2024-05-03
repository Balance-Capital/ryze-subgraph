import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { OracleAdded } from "../generated/schema"
import { OracleAdded as OracleAddedEvent } from "../generated/OracleManager/OracleManager"
import { handleOracleAdded } from "../src/oracle-manager"
import { createOracleAddedEvent } from "./oracle-manager-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let marketId = BigInt.fromI32(234)
    let oracle = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newOracleAddedEvent = createOracleAddedEvent(marketId, oracle)
    handleOracleAdded(newOracleAddedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("OracleAdded created and stored", () => {
    assert.entityCount("OracleAdded", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "OracleAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "marketId",
      "234"
    )
    assert.fieldEquals(
      "OracleAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "oracle",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
