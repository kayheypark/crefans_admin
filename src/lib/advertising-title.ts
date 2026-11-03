/** 기존 기간 2배 상품명을 팬 스튜디오와 동일한 표기로 정규화한다. */
export function advertisingTitle(product:{name:string;durationDays:number}){
 const doubled=/기간\s*2배/.test(product.name)&&product.durationDays>0&&product.durationDays%2===0;
 return doubled?`주목할 크리에이터 (${product.durationDays/2}일+${product.durationDays/2}일)`:product.name.replace(/^주목할 크리에이터\s*\(/,'주목할 크리에이터 (');
}
