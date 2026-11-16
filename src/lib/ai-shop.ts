// AI 이용권 상품 규칙 (2026-11-16). 서버 feat/ai-subscription 검증과 같은 규칙: 1회 단가(결제금액÷수량)는 원 단위 정수이고
// 98원 미만이면 PRICE_BELOW_COST, 구독형은 유효기간 30일만 허용(INVALID_PRODUCT).
export const MIN_UNIT_PRICE=98;
export const SUBSCRIPTION_DAYS=30;
export type ShopKind='pack'|'subscription';
export const KIND_LABELS:Record<ShopKind,string>={pack:'AI 이용권 횟수형',subscription:'AI 이용권 구독형'};

/** 1회 단가와 경고. 수량·금액이 아직 비었으면 둘 다 null. */
export function unitPriceCheck(amount:number,quantity:number):{unitPrice:number|null;warning:string|null}{
 if(!(amount>0)||!(quantity>0))return {unitPrice:null,warning:null};
 const unitPrice=amount/quantity;
 if(!Number.isSafeInteger(unitPrice))return {unitPrice,warning:'1회 단가가 원 단위 정수가 되도록 결제금액과 수량을 맞춰 주세요.'};
 if(unitPrice<MIN_UNIT_PRICE)return {unitPrice,warning:`1회 단가는 원가 하한 ${MIN_UNIT_PRICE}원 이상이어야 합니다.`};
 return {unitPrice,warning:null};
}
