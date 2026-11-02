const shopifyStorefront = {
  apiVersion: '2026-07',
  domain: 'uthryk-xm.myshopify.com',
  storefrontAccessToken: 'e5e16a3d0bec1f53ac5765d1989309db',
  products: {
    mid1: '15461691654331',
    mid1Lid: '15461362794683',
    mid1Pet: '15461363646651',
    mid1TopCase: '15461451169979',
    mid1Pcb: '15461439275195',
    mid1ServiceKit: '15461451792571'
  }
};

const shopifyProductCache = new Map();
const productPurchase = document.querySelector('[data-shopify-product]');
const productCards = document.querySelectorAll('[data-shopify-card-product]');
const policySections = document.querySelectorAll('[data-shopify-policy]');

if (productPurchase) {
  initializeShopifyProduct(productPurchase);
}

productCards.forEach(initializeShopifyCard);
policySections.forEach(initializeShopifyPolicy);

async function initializeShopifyProduct(purchase) {
  const optionsContainer = purchase.querySelector('[data-shopify-options]');
  const availability = purchase.querySelector('[data-shopify-availability]');
  const price = purchase.querySelector('.product-price');
  const addToCart = purchase.querySelector('.product-add-to-cart');

  try {
    const product = await getShopifyProduct(purchase.dataset.shopifyProduct);

    const variants = product.variants.nodes;
    const requestedVariant = new URLSearchParams(window.location.search).get('variant');
    const initialVariant = findRequestedVariant(variants, requestedVariant)
      || variants.find(variant => variant.availableForSale)
      || variants[0];
    const selectedOptions = Object.fromEntries(
      initialVariant.selectedOptions.map(option => [option.name, option.value])
    );

    renderProductOptions(product.options, selectedOptions, optionsContainer, variants, () => {
      updateSelectedVariant(purchase, variants, selectedOptions, price, availability, addToCart);
    });

    updateSelectedVariant(purchase, variants, selectedOptions, price, availability, addToCart);
  } catch (error) {
    console.error('Unable to load Shopify product options.', error);
    if (optionsContainer) {
      optionsContainer.innerHTML = '<p class="product-options-status">options unavailable</p>';
    }
    if (addToCart) {
      addToCart.disabled = true;
    }
  }
}

async function initializeShopifyCard(card) {
  const price = card.querySelector('[data-shopify-card-price]');
  if (!price) return;

  try {
    const product = await getShopifyProduct(card.dataset.shopifyCardProduct);
    const variants = product.variants.nodes;
    const requestedVariant = new URL(card.href).searchParams.get('variant');
    const variant = findRequestedVariant(variants, requestedVariant)
      || variants.find(candidate => candidate.availableForSale)
      || variants[0];

    if (!variant) {
      throw new Error('Shopify product has no variants');
    }

    price.textContent = formatPrice(variant.price);
  } catch (error) {
    console.error('Unable to load Shopify card price.', error);
  }
}

async function initializeShopifyPolicy(section) {
  const title = section.querySelector('[data-shopify-policy-title]');
  const body = section.querySelector('[data-shopify-policy-body]');

  try {
    const policy = await fetchShopifyPolicy(section.dataset.shopifyPolicy);

    if (!policy) {
      throw new Error('Shopify policy is not configured');
    }

    if (title) title.textContent = policy.title;
    if (body) body.innerHTML = policy.body;
  } catch (error) {
    console.error('Unable to load Shopify policy.', error);
  } finally {
    section.removeAttribute('aria-busy');
  }
}

async function fetchShopifyPolicy(policyField) {
  const allowedPolicyFields = new Set([
    'privacyPolicy',
    'refundPolicy',
    'shippingPolicy',
    'termsOfService'
  ]);

  if (!allowedPolicyFields.has(policyField)) {
    throw new Error('Shopify policy is not supported');
  }

  const query = `
    query PolicyForAOkay {
      shop {
        ${policyField} {
          body
          title
          url
        }
      }
    }
  `;

  const response = await fetch(
    `https://${shopifyStorefront.domain}/api/${shopifyStorefront.apiVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyStorefront.storefrontAccessToken
      },
      body: JSON.stringify({ query })
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify request failed with status ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors.map(error => error.message).join('; '));
  }

  return result.data.shop[policyField];
}

function getShopifyProduct(productKey) {
  const productId = shopifyStorefront.products[productKey];

  if (!productId) {
    return Promise.reject(new Error('Shopify product is not configured'));
  }

  if (!shopifyProductCache.has(productKey)) {
    shopifyProductCache.set(
      productKey,
      fetchShopifyProduct(productId).then(product => {
        if (!product) throw new Error('Shopify product not found');
        return product;
      })
    );
  }

  return shopifyProductCache.get(productKey);
}

function findRequestedVariant(variants, requestedVariant) {
  if (!requestedVariant) return null;

  const requestedValue = normalizeOptionValue(requestedVariant);

  return variants.find(variant =>
    variant.selectedOptions.some(option => {
      const optionValue = normalizeOptionValue(option.value);
      return optionValue === requestedValue || optionValue.startsWith(`${requestedValue}-`);
    })
  );
}

function normalizeOptionValue(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function fetchShopifyProduct(productId) {
  const query = `
    query ProductForAOkay($id: ID!) {
      product(id: $id) {
        options {
          name
          optionValues {
            name
          }
        }
        variants(first: 100) {
          nodes {
            id
            availableForSale
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  `;

  const response = await fetch(
    `https://${shopifyStorefront.domain}/api/${shopifyStorefront.apiVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyStorefront.storefrontAccessToken
      },
      body: JSON.stringify({
        query,
        variables: { id: `gid://shopify/Product/${productId}` }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify request failed with status ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors.map(error => error.message).join('; '));
  }

  return result.data.product;
}

function renderProductOptions(options, selectedOptions, container, variants, onChange) {
  if (!container) return;

  container.replaceChildren();

  options
    .filter(option => option.name !== 'Title')
    .forEach(option => {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'product-option';

      const legend = document.createElement('legend');
      legend.textContent = formatOptionName(option.name);
      fieldset.append(legend);

      const values = document.createElement('div');
      values.className = 'product-option-values';

      option.optionValues.forEach(optionValue => {
        const button = document.createElement('button');
        button.className = 'data';
        button.type = 'button';
        button.textContent = optionValue.name;
        button.dataset.optionName = option.name;
        button.dataset.optionValue = optionValue.name;

        const candidateOptions = {
          ...selectedOptions,
          [option.name]: optionValue.name
        };
        button.disabled = !variants.some(variant => variantMatches(variant, candidateOptions));

        button.addEventListener('click', () => {
          selectedOptions[option.name] = optionValue.name;
          updateOptionButtons(container, selectedOptions, variants);
          onChange();
        });

        values.append(button);
      });

      fieldset.append(values);
      container.append(fieldset);
    });

  updateOptionButtons(container, selectedOptions, variants);
}

function updateOptionButtons(container, selectedOptions, variants) {
  container.querySelectorAll('[data-option-name]').forEach(button => {
    const isSelected = selectedOptions[button.dataset.optionName] === button.dataset.optionValue;
    const candidateOptions = {
      ...selectedOptions,
      [button.dataset.optionName]: button.dataset.optionValue
    };

    button.setAttribute('aria-pressed', String(isSelected));
    button.disabled = !variants.some(variant => variantMatches(variant, candidateOptions));
  });
}

function formatOptionName(name) {
  const componentOption = name.match(/^MID\.1\s+(.+?)\s+\((.+)\)$/i);
  return componentOption ? `${componentOption[1]} ${componentOption[2]}` : name;
}

function updateSelectedVariant(purchase, variants, selectedOptions, price, availability, addToCart) {
  const variant = variants.find(candidate => variantMatches(candidate, selectedOptions));

  if (!variant) {
    delete purchase.dataset.shopifyVariantId;
    if (availability) availability.textContent = 'unavailable';
    if (addToCart) addToCart.disabled = true;
    return;
  }

  purchase.dataset.shopifyVariantId = variant.id;

  if (price) {
    price.textContent = formatPrice(variant.price);
  }

  if (availability) {
    availability.textContent = variant.availableForSale ? 'in stock' : 'sold out';
  }

  if (addToCart) {
    addToCart.disabled = !variant.availableForSale;
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(price.amount));
}

function variantMatches(variant, selectedOptions) {
  return Object.entries(selectedOptions).every(([name, value]) =>
    variant.selectedOptions.some(option => option.name === name && option.value === value)
  );
}
