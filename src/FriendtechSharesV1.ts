import {Trade as TradeEvent} from "../generated/FriendtechSharesV1/FriendtechSharesV1";
import {Trade, ProtocolDaily, Protocol} from "../generated/schema";
import {PROTOCOL, BIGINT_ONE, BIGINT_ZERO} from "./constants";
import {GetOrCreateAccount, GetOrCreateHolding, GetOrCreateProtocol} from "./helpers";
import {BigInt, ethereum} from "@graphprotocol/graph-ts";

export function handleTrade(event: TradeEvent): void {
  let trader = GetOrCreateAccount(event.params.trader);
  let subject = GetOrCreateAccount(event.params.subject);
  let holding = GetOrCreateHolding(trader, subject);
  let protocol = GetOrCreateProtocol();

  // Bring store to local variable
  let holdingKeysOwned = holding.keysOwned;
  let subjectKeyupply = subject.keySupply;
  let subjectHoldersCount = subject.holdersCount;

  // Increment Counters on purchase
  if (event.params.isBuy) {
    // Update the holders Count if the new holder had 0 shares previously
    if (holdingKeysOwned == BIGINT_ZERO && event.params.shareAmount.gt(BIGINT_ZERO)) {
      subject.holdersCount = subjectHoldersCount.plus(BIGINT_ONE);
    }

    holding.keysOwned = holdingKeysOwned.plus(event.params.shareAmount);
    subject.keySupply = subjectKeyupply.plus(event.params.shareAmount);
  }
  // Decrement Counters on sale
  else {
    // If this is the last share the person owns, decrement the holders count for the subject
    if (holdingKeysOwned.minus(event.params.shareAmount) == BIGINT_ZERO) {
      subject.holdersCount = subjectHoldersCount.minus(BIGINT_ONE);
    }

    holding.keysOwned = holdingKeysOwned.minus(event.params.shareAmount);
    subject.keySupply = subjectKeyupply.minus(event.params.shareAmount);
  }

  // Update the revenue metric for the subject and protocol
  subject.accountRevenue = subject.accountRevenue.plus(event.params.subjectEthAmount);
  protocol.protocolRevenue = protocol.protocolRevenue.plus(event.params.protocolEthAmount);
  protocol.accountRevenue = protocol.accountRevenue.plus(event.params.subjectEthAmount);
  protocol.tradeVolume = protocol.tradeVolume
    .plus(event.params.ethAmount)
    .plus(event.params.protocolEthAmount)
    .plus(event.params.subjectEthAmount);
  protocol.totalTrades = protocol.totalTrades.plus(BIGINT_ONE);

  // update timestamp
  protocol.timestamp = event.block.timestamp;
  holding.timestamp = event.block.timestamp;
  subject.timestamp = event.block.timestamp;

  protocol.save();
  holding.save();
  subject.save();

  // Event details
  let trade = new Trade(event.transaction.hash.concatI32(event.logIndex.toI32()));
  trade.trader = trader.id;
  trade.subject = subject.id;
  trade.isBuy = event.params.isBuy;
  trade.shareAmount = event.params.shareAmount;
  trade.ethAmount = event.params.ethAmount;
  trade.protocolEthAmount = event.params.protocolEthAmount;
  trade.subjectEthAmount = event.params.subjectEthAmount;
  trade.supply = event.params.supply;

  trade.blockNumber = event.block.number;
  trade.blockTimestamp = event.block.timestamp;
  trade.transactionHash = event.transaction.hash;

  // increment traders trade counter
  trader.tradesCount = trader.tradesCount.plus(BIGINT_ONE);

  // update timestamps
  trader.timestamp = event.block.timestamp;

  trade.save();
  trader.save();

  // TIMESERIES UPDATES
  const day = event.block.timestamp.div(BigInt.fromI32(86400));

  // Collection Address - Day
  let protocolDailyId = PROTOCOL.toHexString() + "-" + day.toString();

  let dailyEntity = ProtocolDaily.load(protocolDailyId);

  if (!dailyEntity) {
    dailyEntity = new ProtocolDaily(protocolDailyId);
    dailyEntity.protocol = PROTOCOL;
    dailyEntity.day = day;
    dailyEntity.dayProtocolRevenue = BIGINT_ZERO;
    dailyEntity.dayTrades = BIGINT_ZERO;
    dailyEntity.totalTradeVolume = BIGINT_ZERO;
    dailyEntity.dayTradeVolume = BIGINT_ZERO;
    dailyEntity.totalAccountRevenue = BIGINT_ZERO;
    dailyEntity.dayAccountRevenue = BIGINT_ZERO;
  }

  //Add incrementors
  dailyEntity.timestamp = event.block.timestamp;
  dailyEntity.userCount = protocol.userCount;
  dailyEntity.totalProtocolRevenue = protocol.protocolRevenue;
  dailyEntity.totalAccountRevenue = protocol.accountRevenue;
  dailyEntity.totalTradeVolume = protocol.tradeVolume;
  dailyEntity.totalTrades = protocol.totalTrades;

  dailyEntity.dayProtocolRevenue = dailyEntity.dayProtocolRevenue.plus(trade.protocolEthAmount);
  dailyEntity.dayAccountRevenue = dailyEntity.dayAccountRevenue.plus(trade.subjectEthAmount);
  dailyEntity.dayTradeVolume = dailyEntity.dayTradeVolume
    .plus(trade.ethAmount)
    .plus(trade.protocolEthAmount)
    .plus(trade.subjectEthAmount);
  dailyEntity.dayTrades = dailyEntity.dayTrades.plus(BIGINT_ONE);

  dailyEntity.save();
}
