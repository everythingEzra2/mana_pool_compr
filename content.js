(function() {
  const cardPrices = new Map();
  let hoverTimeout = null;
  const HOVER_DELAY = 1000;

  function findCardImage(container) {
    const imageSelectors = [
      '.product-image',
      '.product-image-gallery',
      'img.product-image-img',
      '.main-image',
      '.card-image',
      '[data-testid="product-image"]'
    ];

    for (const sel of imageSelectors) {
      const img = container.querySelector(sel);
      if (img) return img;
    }

    const imgs = container.querySelectorAll('img');
    for (const img of imgs) {
      if (img.width > 100 && img.height > 100) {
        return img;
      }
    }

    return null;
  }

  function createPriceDot(cardElement, cardKey) {
    const dot = document.createElement('div');
    dot.className = 'mp-price-dot';
    dot.dataset.key = cardKey;
    dot.innerHTML = '<div class="mp-dot-inner"></div>';

    const cardImage = findCardImage(cardElement);
    if (cardImage && cardImage.parentElement) {
      cardImage.parentElement.style.position = 'relative';
      cardImage.parentElement.appendChild(dot);
    } else {
      cardElement.style.position = cardElement.style.position || 'relative';
      cardElement.appendChild(dot);
    }
    return dot;
  }

  function updateDot(dot, state, data) {
    dot.className = 'mp-price-dot';
    
    switch (state) {
      case 'loading':
        dot.classList.add('mp-loading');
        dot.innerHTML = '<div class="mp-dot-inner"><div class="mp-spinner"></div></div>';
        break;
      case 'success':
        dot.classList.add('mp-success');
        dot.innerHTML = `<div class="mp-dot-inner">Mana Pool: $${Number(data.price).toFixed(2)}</div>`;
        break;
      case 'error':
        dot.classList.add('mp-error');
        dot.innerHTML = `<div class="mp-dot-inner">✕ error</div>`;
        break;
      default:
        dot.innerHTML = '<div class="mp-dot-inner"></div>';
    }
  }

  function getCardKey(cardName, setCode) {
    return `${cardName}|${setCode || 'default'}`;
  }

  function getCardElement(element) {
    const cardSelectors = [
      '.card',
      '.search-result',
      '.product-card',
      '[data-card-id]',
      '.card-item',
      '.results-item',
      '.product-details',
      '.product-container',
      '.product-page'
    ];

    for (const sel of cardSelectors) {
      const card = element.closest(sel);
      if (card) return card;
    }
    
    const parent = element.parentElement;
    if (parent && parent.offsetWidth > 100 && parent.offsetHeight > 100) {
      return parent;
    }
    
    return null;
  }

  function extractCardName(element) {
    const cardEl = getCardElement(element);
    if (!cardEl) return null;

    const selectors = [
      '.product-details__name',
      '[data-testid="product-name"]',
      '.search-result__title',
      '.product-card__title',
      '[data-cy="card-name"]',
      '.card-text-title',
      '.card-name',
      'h1',
      '.product-name'
    ];

    for (const sel of selectors) {
      const el = cardEl.querySelector(sel);
      if (el) {
        const text = el.textContent.trim();
        if (text && text.length < 200 && !text.includes('Search')) {
          return text;
        }
      }
    }
    return null;
  }

  function extractSetCode(element) {
    const cardEl = getCardElement(element);
    if (!cardEl) return null;

    const selectors = [
      '.product-details__set',
      '[data-testid="product-set"]',
      '.search-result__set',
      '.set-name',
      '.card-set'
    ];

    for (const sel of selectors) {
      const el = cardEl.querySelector(sel);
      if (el) {
        return el.textContent.trim();
      }
    }
    return null;
  }

  function initCards() {
    const cards = document.querySelectorAll('.card, .search-result, .product-card, [data-card-id], .card-item, .results-item, .product-details, .product-container, .product-page');
    
    cards.forEach(card => {
      if (card.querySelector('.mp-price-dot')) return;
      
      const name = extractCardName(card);
      if (!name) return;

      const setCode = extractSetCode(card);
      const cardKey = getCardKey(name, setCode);
      
      const dot = createPriceDot(card, cardKey);
      updateDot(dot, 'default');
    });
  }

  let initTimeout = null;
  function scheduleInit() {
    if (initTimeout) clearTimeout(initTimeout);
    initTimeout = setTimeout(initCards, 500);
  }

  function handleMouseEnter(event) {
    const target = event.target;
    const cardEl = getCardElement(target);
    if (!cardEl) return;

    let dot = cardEl.querySelector('.mp-price-dot');

    if (!dot) {
      const name = extractCardName(target);
      const setCode = extractSetCode(target);
      if (!name) return;

      const cardKey = getCardKey(name, setCode);
      dot = createPriceDot(cardEl, cardKey);
      updateDot(dot, 'default');
    }

    const cardKey = dot.dataset.key;
    const cached = cardPrices.get(cardKey);

    if (cached && cached.price !== undefined) {
      updateDot(dot, 'success', { price: cached.price });
      return;
    }

    if (cached && cached.loading) return;

    if (hoverTimeout) clearTimeout(hoverTimeout);

    hoverTimeout = setTimeout(() => {
      const cardName = extractCardName(target);
      const setCode = extractSetCode(target);
      if (!cardName) return;

      updateDot(dot, 'loading');

      cardPrices.set(cardKey, { loading: true });

      chrome.runtime.sendMessage(
        { type: 'GET_PRICE', cardName, setCode },
        ({ price, error }) => {
          if (error || price === null) {
            cardPrices.set(cardKey, { error: true });
            updateDot(dot, 'error');
          } else {
            cardPrices.set(cardKey, { price });
            updateDot(dot, 'success', { price });
          }
        }
      );
    }, HOVER_DELAY);
  }

  function handleMouseLeave() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  }

  function init() {
    initCards();
    
    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);
    
    const observer = new MutationObserver(() => {
      scheduleInit();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
