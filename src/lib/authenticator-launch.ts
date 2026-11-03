// Best-effort iOS launch only; no secrets, account data or provisioning URI.
// Google does not publish a current compatibility guarantee for this scheme.
export function authenticatorLink(userAgent:string,maxTouchPoints=0):string|null{
 const ios=/iPhone|iPad|iPod/i.test(userAgent)||(/Macintosh/i.test(userAgent)&&maxTouchPoints>1);
 return ios?'googleauthenticator://':null;
}
