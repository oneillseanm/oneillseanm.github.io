const disclosureNav = document.querySelector('[data-disclosure-nav]');

if (disclosureNav) {
	const menuButton = disclosureNav.querySelector('.menu-toggle');
	const menuDrawer = disclosureNav.querySelector(`#${menuButton.getAttribute('aria-controls')}`);
	const currentPage = window.location.pathname.split('/').pop();

	menuDrawer.querySelectorAll('a').forEach((link) => {
		if (link.getAttribute('href') === currentPage) {
			link.setAttribute('aria-current', 'page');
		}
	});

	function setMenuOpen(isOpen, returnFocus = false) {
		menuButton.setAttribute('aria-expanded', String(isOpen));
		menuDrawer.hidden = !isOpen;

		if (returnFocus) {
			menuButton.focus();
		}
	}

	menuButton.addEventListener('click', () => {
		const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
		setMenuOpen(!isOpen);
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
			setMenuOpen(false, true);
		}
	});

	document.addEventListener('pointerdown', (event) => {
		if (menuButton.getAttribute('aria-expanded') === 'true' && !disclosureNav.contains(event.target)) {
			setMenuOpen(false);
		}
	});
}
