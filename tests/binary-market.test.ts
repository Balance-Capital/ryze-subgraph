import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { BinaryMarketClaimed } from "../generated/schema"
import { BinaryMarketClaimed as BinaryMarketClaimedEvent } from "../generated/BinaryMarket/BinaryMarket"
import { handleBinaryMarketClaimed } from "../src/binary-market"
import { createBinaryMarketClaimedEvent } from "./binary-market-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let marketName = "Example string value"
    let user = Address.fromString("0x0000000000000000000000000000000000000001")
    let timeframeId = BigInt.fromI32(234)
    let roundId = BigInt.fromI32(234)
    let amount = BigInt.fromI32(234)
    let newBinaryMarketClaimedEvent = createBinaryMarketClaimedEvent(
      marketName,
      user,
      timeframeId,
      roundId,
      amount
    )
    handleBinaryMarketClaimed(newBinaryMarketClaimedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("BinaryMarketClaimed created and stored", () => {
    assert.entityCount("BinaryMarketClaimed", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BinaryMarketClaimed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "marketName",
      "Example string value"
    )
    assert.fieldEquals(
      "BinaryMarketClaimed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "user",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "BinaryMarketClaimed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "timeframeId",
      "234"
    )
    assert.fieldEquals(
      "BinaryMarketClaimed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "roundId",
      "234"
    )
    assert.fieldEquals(
      "BinaryMarketClaimed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
