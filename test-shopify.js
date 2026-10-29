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

const productPurchase = document.querySelector('[data-shopify-product]');

if (productPurchase) {
  initializeShopifyProduct(productPurchase);
}

async function initializeShopifyProduct(purchase) {
  const optionsContainer = purchase.querySelector('[data-shopify-options]');
  const availability = purchase.querySelector('[data-shopify-availability]');
  const price = purchase.querySelector('.product-price');
  const addToCart = purchase.querySelector('.product-add-to-cart');

  try {
    const productId = shopifyStorefront.products[purchase.dataset.shopifyProduct];

    if (!productId) {
      throw new Error('Shopify product is not configured');
    }

    const product = await fetchShopifyProduct(productId);

    if (!product) {
      throw new Error('Shopify product not found');
    }

    const variants = product.variants.nodes;
    const initialVariant = variants.find(variant => variant.availableForSale) || variants[0];
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
    price.textContent = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: variant.price.currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(variant.price.amount));
  }

  if (availability) {
    availability.textContent = variant.availableForSale ? 'in stock' : 'sold out';
  }

  if (addToCart) {
    addToCart.disabled = !variant.availableForSale;
  }
}

function variantMatches(variant, selectedOptions) {
  return Object.entries(selectedOptions).every(([name, value]) =>
    variant.selectedOptions.some(option => option.name === name && option.value === value)
  );
}
