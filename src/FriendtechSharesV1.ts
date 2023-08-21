import {Trade as TradeEvent} from "../generated/FriendtechSharesV1/FriendtechSharesV1";
import {Trade} from "../generated/schema";
import {BIGINT_ONE, BIGINT_ZERO} from "./constants";
import {GetOrCreateAccount, GetOrCreateHolding, GetOrCreateProtocol} from "./helpers";

export function handleTrade(event: TradeEvent): void {
  let trader = GetOrCreateAccount(event.params.trader);
  let subject = GetOrCreateAccount(event.params.subject);
  let holding = GetOrCreateHolding(trader, subject);
  let protocol = GetOrCreateProtocol();

  // Bring store to local variable
  let holdingSharedOwned = holding.sharesOwned;
  let subjectShareSupply = subject.shareSupply;
  let subjectHoldersCount = subject.holdersCount;

  // Increment Counters on purchase
  if (event.params.isBuy) {
    // Update the holders Count if the new holder had 0 shares previously
    if (holdingSharedOwned == BIGINT_ZERO && event.params.shareAmount.gt(BIGINT_ZERO)) {
      subject.holdersCount = subjectHoldersCount.plus(BIGINT_ONE);
    }

    holding.sharesOwned = holdingSharedOwned.plus(event.params.shareAmount);
    subject.shareSupply = subjectShareSupply.plus(event.params.shareAmount);
  }
  // Decrement Counters on sale
  else {
    // If this is the last share the person owns, decrement the holders count for the subject
    if (holdingSharedOwned.minus(event.params.shareAmount) == BIGINT_ZERO) {
      subject.holdersCount = subjectHoldersCount.minus(BIGINT_ONE);
    }

    holding.sharesOwned = holdingSharedOwned.minus(event.params.shareAmount);
    subject.shareSupply = subjectShareSupply.minus(event.params.shareAmount);
  }

  // Update the revenue metric for the Account and protocol
  subject.accountRevenue = subject.accountRevenue.plus(event.params.subjectEthAmount);
  protocol.protocolRevenue = protocol.protocolRevenue.plus(event.params.protocolEthAmount);

  protocol.save();
  holding.save();
  subject.save();

  // Event details
  let _trade = new Trade(event.transaction.hash.concatI32(event.logIndex.toI32()));
  _trade.trader = trader.id;
  _trade.subject = subject.id;
  _trade.isBuy = event.params.isBuy;
  _trade.shareAmount = event.params.shareAmount;
  _trade.ethAmount = event.params.ethAmount;
  _trade.protocolEthAmount = event.params.protocolEthAmount;
  _trade.subjectEthAmount = event.params.subjectEthAmount;
  _trade.supply = event.params.supply;

  _trade.blockNumber = event.block.number;
  _trade.blockTimestamp = event.block.timestamp;
  _trade.transactionHash = event.transaction.hash;

  // increment traders trade counter
  trader.tradesCount = trader.tradesCount.plus(BIGINT_ONE);

  _trade.save();
  trader.save();
}
