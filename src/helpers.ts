import { Account, Admin, TokenBalance } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export const loadOrCreateAccount = (address: string): Account => {
  let account = Account.load(address);
  if (account == null) {
    account = new Account(address);
    account.save();
  }
  return account as Account;
};

export const loadOrCreateTokenBalance = (
  tokenId: string,
  address: string
): TokenBalance => {
  let id = tokenId.concat('-').concat(address);
  let tokenBalance = TokenBalance.load(id);
  if (tokenBalance == null) {
    tokenBalance = new TokenBalance(id);
    tokenBalance.amount = BigInt.fromI32(0);
    tokenBalance.token = tokenId;
    let account = loadOrCreateAccount(address)
    account.save()
    tokenBalance.account = account.id;
    tokenBalance.save();
  }
  return tokenBalance as TokenBalance;
};

export const getAdmin = (): Admin => {
  let admin = Admin.load("1");
  if (admin == null) {
    admin = new Admin("1");
    admin.owner = ADDRESS_ZERO;
    admin.signers = [];
    admin.save();
  }
  return admin as Admin;
};
