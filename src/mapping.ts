import {
  Address,
  BigInt,
  Bytes,
  ipfs,
  json,
  JSONValue,
  Value,
} from "@graphprotocol/graph-ts";
import {
  NFTOBR,
  ApprovalForAll,
  OwnershipTransferred,
  SecondarySaleFees,
  SignerAdded,
  SignerRemoved,
  TransferBatch,
  TransferSingle,
  URI,
} from "../generated/NFTOBR/NFTOBR";
import {
  Account,
  Admin,
  ApprovEntity,
  Token,
  TokenBalance,
  Transaction,
} from "../generated/schema";
import {
  ADDRESS_ZERO,
  getAdmin,
  loadOrCreateAccount,
  loadOrCreateTokenBalance,
  loadOrCreateTransaction,
  loadOrCreateTransfer,
} from "./helpers";

export function handleApprovalForAll(event: ApprovalForAll): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ApprovEntity.load(event.transaction.from.toHex());

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new ApprovEntity(event.transaction.from.toHex());

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0);
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count.plus(BigInt.fromI32(1));

  // Entity fields can be set based on event parameters
  entity._owner = event.params._owner;
  entity._operator = event.params._operator;

  // Entities can be written to the store with `.save()`
  entity.save();

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.balanceOf(...)
  // - contract.balanceOfBatch(...)
  // - contract.contractURI(...)
  // - contract.creators(...)
  // - contract.encodePackedData(...)
  // - contract.fees(...)
  // - contract.getFeeBps(...)
  // - contract.getFeeRecipients(...)
  // - contract.getecrecover(...)
  // - contract.isApprovedForAll(...)
  // - contract.isOwner(...)
  // - contract.isSigner(...)
  // - contract.name(...)
  // - contract.owner(...)
  // - contract.supportsInterface(...)
  // - contract.symbol(...)
  // - contract.tokenURIPrefix(...)
  // - contract.uri(...)
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  let admin = getAdmin();
  let newOwnerAddressStr = event.params.newOwner.toHex();
  let oldOwnerAddressStr = event.params.previousOwner.toHex();
  admin.owner = newOwnerAddressStr;
  let oldAccount = loadOrCreateAccount(oldOwnerAddressStr);
  oldAccount.save();
  let newAccount = loadOrCreateAccount(newOwnerAddressStr);
  newAccount.save();
  admin.save();
}

export function handleSecondarySaleFees(event: SecondarySaleFees): void {}

export function handleSignerAdded(event: SignerAdded): void {
  let admin = getAdmin();
  let signers = admin.signers;
  let signer = loadOrCreateAccount(event.params.account.toHex())
  signers.push(signer.id);
  admin.signers = signers;
  admin.save();
}

export function handleSignerRemoved(event: SignerRemoved): void {
  let admin = getAdmin();
  let signers = admin.signers;
  signers = signers.filter((signer) => signer != event.params.account.toHex());
  admin.signers = signers;
  admin.save();
}

export function handleTransferBatch(event: TransferBatch): void {}

export function handleTransferSingle(event: TransferSingle): void {
  loadOrCreateTransaction(event)

  let tokenId = event.params._id.toHex();
  let amount = event.params._value;
  let from = event.params._from;
  let to = event.params._to;
  let operator = event.params._operator;
  let token = Token.load(tokenId);

  if (token == null) {
    token = new Token(tokenId);
  }

  if (event.params._from.toHex() == ADDRESS_ZERO) {
    // Mint Token
    token.supply = amount;
    token.minter = operator;
    token.save();
  } else {
    let tokenBalanceFrom = loadOrCreateTokenBalance(tokenId, from.toHex());
    tokenBalanceFrom.amount = tokenBalanceFrom.amount.minus(amount);
    tokenBalanceFrom.save();
  }

  let tokenBalanceTo = loadOrCreateTokenBalance(tokenId, to.toHex());
  tokenBalanceTo.amount = tokenBalanceTo.amount.plus(amount);
  tokenBalanceTo.save();
  loadOrCreateTransfer(event);
}

export function handleURI(event: URI): void {
  let tokenId = event.params._id.toHex();
  let uri = event.params._value;
  let token = Token.load(tokenId);
  if (token == null) {
    token = new Token(tokenId);
    token.supply = BigInt.fromI32(1);
    token.minter = Address.fromString(ADDRESS_ZERO)
  }
  token.meta = uri;
  token.save();
}
