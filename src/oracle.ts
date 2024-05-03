import { Oracle, Price } from "../generated/schema";
import {
  WriterUpdated as WriterUpdatedEvent,
  WrotePrice as WrotePriceEvent,
} from "../generated/templates/Oracle/Oracle";
import { EIGHT_BD } from "./constants";
import { genericId } from "./helpers";

export function handleOracleWriterUpdated(event: WriterUpdatedEvent): void {
  let oracle = Oracle.load(event.address.toHex());
  if (oracle == null) {
    oracle = new Oracle(event.address.toHex());
    oracle.address = event.address;
  }
  if (event.params.enabled) {
    oracle.writer = event.params.writer;
  }
  oracle.save();
}

export function handleOraclePriceWrote(event: WrotePriceEvent): void {
  let oracle = Oracle.load(event.address.toHex());
  if (oracle == null) {
    oracle = new Oracle(event.address.toHex());
    oracle.address = event.address;
    oracle.save();
  }

  let price = new Price(genericId(event));
  price.oracle = oracle.address.toHex();
  price.timestamp = event.params.timestamp;
  price.price = event.params.price.divDecimal(EIGHT_BD);
  price.writer = event.params.writer;
  
  price.save();
}
