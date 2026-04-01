const API_BASE = 'https://manapool.com/api/v1';
const CACHE_DURATION = 5 * 60 * 1000;

const cache = new Map();

async function fetchManaPoolPrice(cardName, setCode = null, cardNumber = null) {
  const cacheKey = `${cardName}|${setCode || 'default'}|${cardNumber || 'default'}`;
  
  if (cache.has(cacheKey)) {
    const { price, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return price;
    }
  }

  try {
    const body = { card_names: [cardName] };
    if (setCode) body.set_code = setCode;
    if (cardNumber) body.collector_number = cardNumber;

    const response = await fetch(`${API_BASE}/card_info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    console.log(data);
    let card0 = data.cards?.[0];
    console.log(card0);
    const price_cents = card0?.from_price_cents ?? null;
    const price = price_cents !== null ? (price_cents / 100).toFixed(2) : null;
    
    cache.set(cacheKey, { price, timestamp: Date.now() });
    return price;
  } catch (err) {
    console.error('Mana Pool extension error:', err);
    return null;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PRICE') {
    fetchManaPoolPrice(request.cardName, request.setCode, request.cardNumber)
      .then(price => sendResponse({ price, error: price === null }))
      .catch(err => sendResponse({ price: null, error: true }));
    return true;
  }
});
