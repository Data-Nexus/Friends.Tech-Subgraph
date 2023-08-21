import {Address} from "@graphprotocol/graph-ts";
import {BigDecimal, BigInt, ethereum} from "@graphprotocol/graph-ts";

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const BYTES32_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const PROTOCOL = Address.fromString("0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4");
