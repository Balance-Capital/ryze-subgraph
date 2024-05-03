import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address } from "@graphprotocol/graph-ts"
import { MarketCreated } from "../generated/schema"
import { MarketCreated as MarketCreatedEvent } from "../generated/BinaryMarketManager/BinaryMarketManager"
import { handleMarketCreated } from "../src/binary-market-manager"
import { createMarketCreatedEvent } from "./binary-market-manager-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let market = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let creator = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newMarketCreatedEvent = createMarketCreatedEvent(market, creator)
    handleMarketCreated(newMarketCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("MarketCreated created and stored", () => {
    assert.entityCount("MarketCreated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "MarketCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "market",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "MarketCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "creator",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
