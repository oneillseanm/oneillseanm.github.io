const lightboxImages = document.querySelectorAll(
  '.product-page .product-hero img, .product-page .product-features img'
);

if (lightboxImages.length) {
  const lightboxBreakpoint = window.matchMedia('(min-width: 640px)');
  const dialog = document.createElement('dialog');
  const dialogImage = document.createElement('img');
  const closeButton = document.createElement('button');
  const galleryControls = document.createElement('div');
  const previousButton = document.createElement('button');
  const galleryStatus = document.createElement('p');
  const nextButton = document.createElement('button');
  let activeTrigger = null;
  let activeGallery = null;

  dialog.className = 'lightbox-dialog';
  dialog.setAttribute('aria-label', 'Enlarged product image');

  dialogImage.className = 'lightbox-image';

  closeButton.className = 'lightbox-close';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';

  galleryControls.className = 'product-gallery-controls lightbox-gallery-controls';
  galleryControls.hidden = true;

  previousButton.className = 'product-gallery-control data';
  previousButton.type = 'button';
  previousButton.setAttribute('aria-label', 'Previous product image');
  previousButton.textContent = 'previous';

  galleryStatus.className = 'product-gallery-status data';
  galleryStatus.setAttribute('aria-live', 'polite');
  galleryStatus.setAttribute('aria-atomic', 'true');

  nextButton.className = 'product-gallery-control data';
  nextButton.type = 'button';
  nextButton.setAttribute('aria-label', 'Next product image');
  nextButton.textContent = 'next';

  galleryControls.append(previousButton, galleryStatus, nextButton);
  dialog.append(dialogImage, galleryControls, closeButton);
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
    activeGallery = image.closest('[data-product-gallery]')?.productGallery || null;

    if (activeGallery) {
      const imageIndex = activeGallery.slides.indexOf(image);
      if (imageIndex >= 0) activeGallery.showSlide(imageIndex, false);
      updateLightboxGallery();
    } else {
      dialog.classList.remove('lightbox-dialog--gallery');
      galleryControls.hidden = true;
      dialogImage.src = image.currentSrc || image.src;
      dialogImage.alt = image.alt;
    }

    document.body.classList.add('lightbox-open');
    dialog.showModal();
    closeButton.focus();
  }

  function updateLightboxGallery() {
    if (!activeGallery) return;

    const currentIndex = activeGallery.getCurrentIndex();
    const currentImage = activeGallery.slides[currentIndex];

    dialog.classList.add('lightbox-dialog--gallery');
    galleryControls.hidden = false;
    dialogImage.src = currentImage.currentSrc || currentImage.src;
    dialogImage.alt = currentImage.alt;
    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === activeGallery.slides.length - 1;
    galleryStatus.textContent = `${currentIndex + 1} of ${activeGallery.slides.length}`;
  }

  function changeLightboxSlide(offset) {
    if (!activeGallery) return;

    activeGallery.showSlide(activeGallery.getCurrentIndex() + offset, false);
    updateLightboxGallery();
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
  previousButton.addEventListener('click', () => changeLightboxSlide(-1));
  nextButton.addEventListener('click', () => changeLightboxSlide(1));

  dialog.addEventListener('keydown', (event) => {
    if (!activeGallery) return;

    if (event.key === 'ArrowLeft' && !previousButton.disabled) {
      event.preventDefault();
      changeLightboxSlide(-1);
    }

    if (event.key === 'ArrowRight' && !nextButton.disabled) {
      event.preventDefault();
      changeLightboxSlide(1);
    }
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeLightbox();
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
    dialogImage.removeAttribute('src');

    if (lightboxBreakpoint.matches) {
      const returnTarget = activeGallery
        ? activeGallery.slides[activeGallery.getCurrentIndex()]
        : activeTrigger;
      activeGallery?.updateStatus();
      returnTarget?.focus();
    }

    dialog.classList.remove('lightbox-dialog--gallery');
    galleryControls.hidden = true;
    activeGallery = null;
    activeTrigger = null;
  });

  lightboxBreakpoint.addEventListener('change', updateImageControls);
  updateImageControls();
}
