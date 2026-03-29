const API_BASE = 'https://manapool.com/api/v1';
const CACHE_DURATION = 5 * 60 * 1000;

const cache = new Map();

async function fetchManaPoolPrice(cardName, setCode = null) {
  const cacheKey = `${cardName}|${setCode || 'default'}`;
  
  if (cache.has(cacheKey)) {
    const { price, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return price;
    }
  }

  try {
    const body = setCode 
      ? JSON.stringify({ card_names: [cardName], set_code: setCode })
      : JSON.stringify({ card_names: [cardName] });

    const response = await fetch(`${API_BASE}/card_info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const price = data.prices?.[0]?.price ?? data.prices?.[0]?.condition_price ?? null;
    
    cache.set(cacheKey, { price, timestamp: Date.now() });
    return price;
  } catch (err) {
    console.error('Mana Pool extension error:', err);
    return null;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PRICE') {
    fetchManaPoolPrice(request.cardName, request.setCode)
      .then(price => sendResponse({ price, error: price === null }))
      .catch(err => sendResponse({ price: null, error: true }));
    return true;
  }
});
