(() => {
	const config = Object.freeze({
		// Change this one value to 'live' when public purchasing should open.
		purchasingMode: 'preview'
	});
	const purchaseActionSelector = [
		'.product-add-to-cart',
		'[data-cart-checkout]',
		'[data-storefront-purchase-action]'
	].join(', ');
	const isPurchasingLive = config.purchasingMode === 'live';

	window.aokayStorefront = Object.freeze({
		config,
		isPurchasingLive
	});

	document.documentElement.dataset.purchasingMode = config.purchasingMode;

	if (isPurchasingLive) return;

	function disablePurchaseAction(action) {
		if (action.matches('button, input')) action.disabled = true;
		if (action.matches('a')) action.removeAttribute('href');

		action.setAttribute('aria-disabled', 'true');
		action.classList.add('storefront-unavailable');
		action.textContent = 'Available soon';
	}

	function applyPreviewMode(root = document) {
		root.querySelectorAll?.(purchaseActionSelector).forEach(disablePurchaseAction);
	}

	document.addEventListener('click', event => {
		if (event.target.closest(purchaseActionSelector)) {
			event.preventDefault();
		}
	}, true);

	applyPreviewMode();

	const observer = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			mutation.addedNodes.forEach(node => {
				if (!(node instanceof Element)) return;
				if (node.matches(purchaseActionSelector)) disablePurchaseAction(node);
				applyPreviewMode(node);
			});
		});
	});

	observer.observe(document.body, { childList: true, subtree: true });
})();
