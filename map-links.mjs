export const VENUE_QUERY = "플로렌스파티하우스 수원점";
export function getMapLinks(userAgent, pageUrl) {
  const query = encodeURIComponent(VENUE_QUERY);
  const appname = encodeURIComponent(pageUrl);
  const action = `search?query=${query}&appname=${appname}`;
  const web = `https://map.naver.com/p/search/${query}`;
  const scheme = `nmap://${action}`;
  if (/Android/i.test(userAgent)) {
    return { platform: "android", web, app: `intent://${action}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;S.browser_fallback_url=${encodeURIComponent(web)};end` };
  }
  if (/iPhone|iPad|iPod/i.test(userAgent)) return { platform: "ios", web, app: scheme };
  return { platform: "desktop", web, app: null };
}

