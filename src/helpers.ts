import {Address} from "@graphprotocol/graph-ts";
import {Account, Holding, Protocol} from "../generated/schema";
import {BIGINT_ONE, BIGINT_ZERO, PROTOCOL} from "./constants";

export function GetOrCreateAccount(address: Address): Account {
  let account = Account.load(address);

  if (!account) {
    let protocol = GetOrCreateProtocol();
    let protocolUserCount = protocol.userCount.plus(BIGINT_ONE);
    protocol.userCount = protocolUserCount;

    account = new Account(address);
    account.timestamp = BIGINT_ZERO;
    account.holdersCount = BIGINT_ZERO;
    account.tradesCount = BIGINT_ZERO;
    account.keySupply = BIGINT_ZERO;
    account.accountRevenue = BIGINT_ZERO;

    protocol.save();
    account.save();
  }

  return account as Account;
}

export function GetOrCreateHolding(holder: Account, subject: Account): Holding {
  let holding = Holding.load(holder.id.concat(subject.id));

  if (!holding) {
    holding = new Holding(holder.id.concat(subject.id));
    holding.timestamp = BIGINT_ZERO;
    holding.holder = holder.id; // Account!
    holding.subject = subject.id; // Account!
    holding.keysOwned = BIGINT_ZERO; // BigInt!

    holding.save();
  }

  return holding as Holding;
}

export function GetOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL);

  if (!protocol) {
    protocol = new Protocol(PROTOCOL);
    protocol.timestamp = BIGINT_ZERO;
    protocol.userCount = BIGINT_ZERO;
    protocol.protocolRevenue = BIGINT_ZERO;
    protocol.totalTrades = BIGINT_ZERO;

    protocol.save();
  }

  return protocol as Protocol;
}
