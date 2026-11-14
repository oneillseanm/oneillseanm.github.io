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
	}

	menuButton.addEventListener('click', () => {
		const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
		setMenuOpen(!isOpen);
	});

	groupDetails.forEach((details) => {
		details.addEventListener('toggle', () => {
			if (details.open) closeGroups(details);
			syncExpandedGroupHeight();
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
		if (!desktopNavigation.matches && menuButton.getAttribute('aria-expanded') === 'true') {
			setMenuOpen(false);
		}
	});

	desktopNavigation.addEventListener('change', () => {
		setMenuOpen(false);
		syncExpandedGroupHeight();
	});

	window.addEventListener('resize', syncExpandedGroupHeight);
}
