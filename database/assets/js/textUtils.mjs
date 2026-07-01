

/**
 * private ハッシュ化
 * @param {*} text 
 * @returns 
 * @see https://qiita.com/economist/items/768d2f6a10d54d4fa39f
 */
export async function hash(text) {
  const uint8  = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', uint8);
  return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2,'0')).join('');
}

/**
 * 
 * @param {string} query 
 * @returns 
 */
export function query2Map(query) {
  return Object.fromEntries(
      query.replace(/^(\?|#)/, '')
        .split('&')
        .map(param => {
          const [key, value] = param.split('=');
          return [key, value || true];
        })
    )
}
