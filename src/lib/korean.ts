// Korean particles that depend on whether the preceding word ends in a final consonant (받침).
// Digits are read as Sino-Korean numbers (일, 이, 삼 …); other non-Hangul endings return both forms.
const DIGIT_FINAL=[true,true,false,true,false,false,true,true,true,false]; // 영 일 이 삼 사 오 육 칠 팔 구

export function hasFinalConsonant(word:string):boolean|null{
 const last=word.trim().replace(/[\s.,!?)"'\]}>~…]+$/,'').slice(-1);
 if(!last)return null;
 const code=last.charCodeAt(0);
 if(code>=0xac00&&code<=0xd7a3)return (code-0xac00)%28!==0;
 if(/[0-9]/.test(last))return DIGIT_FINAL[Number(last)];
 return null;
}

/** Returns the word followed by the correct particle, e.g. withParticle('정책 변경','을','를') → '정책 변경을'. */
export function withParticle(word:string,afterConsonant:string,afterVowel:string){
 const final=hasFinalConsonant(word);
 return word+(final===null?`${afterConsonant}(${afterVowel})`:final?afterConsonant:afterVowel);
}
export const objectParticle=(word:string)=>withParticle(word,'을','를');
