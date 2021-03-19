import { Account, Admin, TokenBalance, Transaction, Transfer } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import { TransferSingle } from "../generated/NFTOBR/NFTOBR";

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
  let id = tokenId.concat("-").concat(address);
  let tokenBalance = TokenBalance.load(id);
  if (tokenBalance == null) {
    tokenBalance = new TokenBalance(id);
    tokenBalance.amount = BigInt.fromI32(0);
    tokenBalance.token = tokenId;
    let account = loadOrCreateAccount(address);
    account.save();
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

export const loadOrCreateTransfer = (event: TransferSingle): Transfer => {
    let txHash = event.transaction.hash.toHex();
    let logIndex = event.logIndex.toString()
    let transferID = txHash + "-" + logIndex
    let transfer = Transfer.load(transferID)
    if (transfer == null) {
        transfer = new Transfer(transferID)
        transfer.operator = event.params._operator.toHex()
        transfer.from = event.params._from.toHex()
        transfer.to = event.params._to.toHex()
        transfer.amount = event.params._value
        transfer.transaction = txHash
        transfer.save()
    }
    return transfer as Transfer
}

export const loadOrCreateTransaction = (event: TransferSingle): Transaction => {
  let txHash = event.transaction.hash.toHex();

  let transaction = Transaction.load(txHash);
  if (transaction == null) {
    transaction = new Transaction(txHash);
    transaction.blockNumber = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.save()
  }
  return transaction as Transaction;
};
