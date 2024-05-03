import { OracleAdded as OracleAddedEvent } from "../generated/OracleManager/OracleManager";
import { Oracle } from "../generated/schema";
import { Oracle as OracleTemplate } from "../generated/templates";

export function handleOracleAdded(event: OracleAddedEvent): void {
  OracleTemplate.create(event.params.oracle);

  const vault = new Oracle(event.params.oracle.toHex());
  
  vault.address = event.params.oracle;
  vault.save();
}
