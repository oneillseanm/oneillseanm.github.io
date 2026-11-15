const NAV_PAGE_BLUR_ENABLED = true;

function syncNavigationPageBlur() {
	const primaryMenuIsOpen = document.querySelector('.menu-toggle[aria-expanded="true"]');
	const primaryGroupIsOpen = document.querySelector('[data-disclosure-nav] .nav-group details[open]');
	const storeMenuIsOpen = document.querySelector('.store-local-menu.is-open');

	document.body.classList.toggle(
		'nav-page-blur-active',
		NAV_PAGE_BLUR_ENABLED && Boolean(primaryMenuIsOpen || primaryGroupIsOpen || storeMenuIsOpen)
	);
}

const disclosureNav = document.querySelector('[data-disclosure-nav]');

if (disclosureNav) {
	const menuButton = disclosureNav.querySelector('.menu-toggle');
	const menuDrawer = disclosureNav.querySelector(`#${menuButton.getAttribute('aria-controls')}`);
	const groupDetails = [...menuDrawer.querySelectorAll('.nav-group details')];
	const desktopNavigation = window.matchMedia('(min-width: 768px)');
	const currentPage = window.location.pathname.split('/').pop();

	menuDrawer.querySelectorAll('a').forEach((link) => {
		if (link.getAttribute('href') === currentPage) {
			link.setAttribute('aria-current', 'page');
		}
	});

	function closeGroups(except = null) {
		groupDetails.forEach((details) => {
			if (details !== except) details.open = false;
		});
	}

	function syncExpandedGroupHeight() {
		const openGroup = groupDetails.find((details) => details.open);
		const groupLinks = openGroup?.querySelector('.nav-group-links');

		if (desktopNavigation.matches && groupLinks) {
			disclosureNav.style.setProperty('--nav-group-panel-height', `${groupLinks.scrollHeight}px`);
		} else {
			disclosureNav.style.removeProperty('--nav-group-panel-height');
		}
	}

	function syncPageBlur() {
		syncNavigationPageBlur();
	}

	function setMenuOpen(isOpen, returnFocus = false) {
		menuButton.setAttribute('aria-expanded', String(isOpen));
		menuDrawer.classList.toggle('is-open', isOpen);

		if (isOpen) {
			menuDrawer.querySelector('summary')?.focus();
		} else {
			closeGroups();
		}

		if (returnFocus) {
			menuButton.focus();
		}

		syncPageBlur();
	}

	menuButton.addEventListener('click', () => {
		const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
		setMenuOpen(!isOpen);
	});

	groupDetails.forEach((details) => {
		details.addEventListener('toggle', () => {
			if (details.open) closeGroups(details);
			syncExpandedGroupHeight();
			syncPageBlur();
		});
	});

	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') return;

		const openGroup = groupDetails.find((details) => details.open);
		if (openGroup) {
			openGroup.open = false;
			openGroup.querySelector('summary')?.focus();
			return;
		}

		if (menuButton.getAttribute('aria-expanded') === 'true') {
			setMenuOpen(false, true);
		}
	});

	document.addEventListener('pointerdown', (event) => {
		if (disclosureNav.contains(event.target)) return;

		closeGroups();
		syncPageBlur();
		if (!desktopNavigation.matches && menuButton.getAttribute('aria-expanded') === 'true') {
			setMenuOpen(false);
		}
	});

	desktopNavigation.addEventListener('change', () => {
		setMenuOpen(false);
		syncExpandedGroupHeight();
		syncPageBlur();
	});

	window.addEventListener('resize', syncExpandedGroupHeight);
	syncPageBlur();
}

const productLocalNav = document.querySelector('[data-local-nav]');

if (productLocalNav) {
	const sectionLinks = [...productLocalNav.querySelectorAll('a:not(.local-nav-location)[href^="#"]')];

	function syncLocalNavigationCurrent(hash = window.location.hash) {
		const currentHash = sectionLinks.some((link) => link.getAttribute('href') === hash)
			? hash
			: '';

		sectionLinks.forEach((link) => {
			if (link.getAttribute('href') === currentHash) {
				link.setAttribute('aria-current', 'location');
			} else {
				link.removeAttribute('aria-current');
			}
		});
	}

	sectionLinks.forEach((link) => {
		link.addEventListener('click', () => syncLocalNavigationCurrent(link.getAttribute('href')));
	});

	window.addEventListener('hashchange', () => syncLocalNavigationCurrent());
	syncLocalNavigationCurrent();

	const localBuy = productLocalNav.querySelector('[data-local-buy]');
	const primaryBuy = document.querySelector('.product-add-to-cart');

	if (localBuy && primaryBuy) {
		localBuy.addEventListener('click', () => {
			if (!localBuy.disabled && localBuy.getAttribute('aria-disabled') !== 'true') {
				primaryBuy.click();
			}
		});
	}
}

const storeLocalNav = document.querySelector('[data-store-local-nav]');

if (storeLocalNav) {
	const categoryToggle = storeLocalNav.querySelector('.store-local-toggle');
	const categoryMenu = storeLocalNav.querySelector(`#${categoryToggle.getAttribute('aria-controls')}`);
	const categoryArrow = categoryToggle.querySelector('.store-local-arrow');
	const desktopStoreNavigation = window.matchMedia('(min-width: 640px)');

	function setStoreCategoryMenuOpen(isOpen, returnFocus = false) {
		categoryToggle.setAttribute('aria-expanded', String(isOpen));
		categoryMenu.classList.toggle('is-open', isOpen);
		syncNavigationPageBlur();
		categoryArrow.textContent = isOpen ? '▴' : '▾';

		if (returnFocus) categoryToggle.focus();
	}

	categoryToggle.addEventListener('click', () => {
		setStoreCategoryMenuOpen(categoryToggle.getAttribute('aria-expanded') !== 'true');
	});

	categoryMenu.querySelectorAll('a').forEach((link) => {
		link.addEventListener('click', () => setStoreCategoryMenuOpen(false));
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && categoryToggle.getAttribute('aria-expanded') === 'true') {
			setStoreCategoryMenuOpen(false, true);
		}
	});

	document.addEventListener('pointerdown', (event) => {
		if (!storeLocalNav.contains(event.target)) setStoreCategoryMenuOpen(false);
	});

	desktopStoreNavigation.addEventListener('change', () => setStoreCategoryMenuOpen(false));
}
