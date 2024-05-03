import { VaultAdded as VaultAddedEvent } from "../generated/BinaryVaultManager/BinaryVaultManager";
import { ERC20 } from "../generated/BinaryVaultManager/ERC20";
import { Vault } from "../generated/schema";
import { BinaryVault } from "../generated/templates";
import { BLACKLIST_VAULTS, ZERO_BD, ZERO_BI } from "./constants";

export function handleVaultAdded(event: VaultAddedEvent): void {
  if (BLACKLIST_VAULTS.includes(event.params.vault.toHex())) {
    return;
  }

  let vault = Vault.load(event.params.vault.toHex());

  if (vault === null) {
    BinaryVault.create(event.params.vault);
    vault = new Vault(event.params.vault.toHex());

    vault.underlyingToken = event.params.underlyingToken;

    vault.address = event.params.vault;
    vault.totalStakedAmount = ZERO_BD;
    vault.totalInvestedAmount = ZERO_BD;
    vault.totalShares = ZERO_BD;
    vault.feeAccrued = ZERO_BD;
    vault.tokenIds = [];

    let contract = ERC20.bind(event.params.underlyingToken);
    vault.decimals = contract.decimals();
    vault.symbol = contract.symbol();
    vault.name = contract.name();

    vault.save();
  }
}
