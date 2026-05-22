const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_SEARCH_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const EBAY_SCOPE = 'https://api.ebay.com/oauth/api_scope';
const MARKETPLACE_ID = 'EBAY_US';

const AFFILIATE_PARAMS = {
  mkcid: '1',
  mkrid: '711-53200-19255-0',
  siteid: '0',
  campid: '5339154057',
  customid: 'LucyLPnew',
  toolid: '10001',
  mkevt: '1'
};

const SECTION_QUERIES = {
  'japanese-vinyl': 'Japanese rock metal vinyl Japan press OBI',
  'israeli-vinyl': 'Israeli vinyl record',
  'limited-edition-vinyl': 'limited edition vinyl record',
  posters: 'collectible vintage concert movie poster'
};

const SECTION_LIMIT = 10;

function jsonResponse(body, init = {}) {
  const { cacheControl = 'public, max-age=900', headers = {}, status = 200 } = init;

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheControl,
      ...headers
    }
  });
}

function appendAffiliateParams(itemUrl) {
  if (!itemUrl) {
    return '#';
  }

  try {
    const url = new URL(itemUrl);

    Object.entries(AFFILIATE_PARAMS).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  } catch (_error) {
    return itemUrl;
  }
}

function normalizeItem(item) {
  const price = item.price
    ? `${item.price.currency || 'USD'} ${item.price.value}`
    : '';
  const imageUrl =
    item.image?.imageUrl ||
    item.thumbnailImages?.[0]?.imageUrl ||
    '/vinyl-placeholder.jpg';

  return {
    title: item.title || 'LucyLP Collector Find',
    image: imageUrl,
    imageUrl,
    price,
    condition: item.condition || '',
    url: appendAffiliateParams(item.itemWebUrl)
  };
}

async function getAccessToken(env) {
  if (!env.EBAY_CLIENT_ID || !env.EBAY_CLIENT_SECRET) {
    throw new Error('Missing eBay API credentials');
  }

  const credentials = btoa(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`);
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: EBAY_SCOPE
  });

  const response = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      authorization: `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    throw new Error(`eBay OAuth failed with ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function searchItems(accessToken, query) {
  const url = new URL(EBAY_SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(SECTION_LIMIT));
  url.searchParams.set('sort', 'newlyListed');

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'x-ebay-c-marketplace-id': MARKETPLACE_ID
    }
  });

  if (!response.ok) {
    throw new Error(`eBay Browse search failed with ${response.status}`);
  }

  const data = await response.json();
  return (data.itemSummaries || []).slice(0, SECTION_LIMIT).map(normalizeItem);
}

export async function onRequestGet({ env }) {
  try {
    const accessToken = await getAccessToken(env);
    const entries = await Promise.all(
      Object.entries(SECTION_QUERIES).map(async ([key, query]) => {
        const items = await searchItems(accessToken, query);
        return [key, items];
      })
    );

    return jsonResponse({
      updatedAt: new Date().toISOString(),
      sections: Object.fromEntries(entries)
    });
  } catch (error) {
    return jsonResponse(
      {
        error: 'Live eBay feed unavailable',
        message: error.message
      },
      {
        status: 502,
        cacheControl: 'no-store'
      }
    );
  }
}
