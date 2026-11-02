const lightboxImages = document.querySelectorAll(
  '.product-page .product-hero img, .product-page .product-features img'
);

if (lightboxImages.length) {
  const lightboxBreakpoint = window.matchMedia('(min-width: 640px)');
  const dialog = document.createElement('dialog');
  const dialogImage = document.createElement('img');
  const closeButton = document.createElement('button');
  let activeTrigger = null;

  dialog.className = 'lightbox-dialog';
  dialog.setAttribute('aria-label', 'Enlarged product image');

  dialogImage.className = 'lightbox-image';

  closeButton.className = 'lightbox-close';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';

  dialog.append(dialogImage, closeButton);
  document.body.append(dialog);

  function imageLabel(image) {
    const alt = image.alt.trim();
    const heading = image.closest('section')?.querySelector('h3')?.textContent.trim();

    if (alt) return `Enlarge image: ${alt}`;
    if (heading) return `Enlarge image for ${heading}`;
    return 'Enlarge image';
  }

  function openLightbox(image) {
    if (!lightboxBreakpoint.matches) return;

    activeTrigger = image;
    dialogImage.src = image.currentSrc || image.src;
    dialogImage.alt = image.alt;
    document.body.classList.add('lightbox-open');
    dialog.showModal();
    closeButton.focus();
  }

  function closeLightbox() {
    if (dialog.open) dialog.close();
  }

  function updateImageControls() {
    lightboxImages.forEach((image) => {
      if (lightboxBreakpoint.matches) {
        image.dataset.lightboxImage = '';
        image.setAttribute('role', 'button');
        image.setAttribute('tabindex', '0');
        image.setAttribute('aria-haspopup', 'dialog');
        image.setAttribute('aria-label', imageLabel(image));
      } else {
        delete image.dataset.lightboxImage;
        image.removeAttribute('role');
        image.removeAttribute('tabindex');
        image.removeAttribute('aria-haspopup');
        image.removeAttribute('aria-label');
      }
    });

    if (!lightboxBreakpoint.matches) closeLightbox();
  }

  lightboxImages.forEach((image) => {
    image.addEventListener('click', () => openLightbox(image));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(image);
      }
    });
  });

  closeButton.addEventListener('click', closeLightbox);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeLightbox();
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
    dialogImage.removeAttribute('src');

    if (activeTrigger && lightboxBreakpoint.matches) activeTrigger.focus();
    activeTrigger = null;
  });

  lightboxBreakpoint.addEventListener('change', updateImageControls);
  updateImageControls();
}
