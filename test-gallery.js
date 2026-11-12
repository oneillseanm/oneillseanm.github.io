document.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
  const slides = Array.from(gallery.querySelectorAll('[data-gallery-slide]'));
  const previousButton = gallery.querySelector('[data-gallery-previous]');
  const nextButton = gallery.querySelector('[data-gallery-next]');
  const status = gallery.querySelector('.product-gallery-status');
  const swipeThreshold = 50;
  let currentIndex = 0;
  let suppressClickUntil = 0;
  let touchStartX = null;
  let touchStartY = null;

  if (!slides.length || !previousButton || !nextButton || !status) return;

  function updateStatus() {
    status.textContent = `${currentIndex + 1} of ${slides.length}`;
  }

  function showSlide(index, announce = true) {
    currentIndex = Math.max(0, Math.min(index, slides.length - 1));

    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== currentIndex;
    });

    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === slides.length - 1;
    if (announce) updateStatus();
  }

  gallery.productGallery = {
    slides,
    getCurrentIndex: () => currentIndex,
    showSlide,
    updateStatus
  };

  previousButton.addEventListener('click', () => showSlide(currentIndex - 1));
  nextButton.addEventListener('click', () => showSlide(currentIndex + 1));

  gallery.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1 || !event.target.closest('[data-gallery-slide]')) {
      touchStartX = null;
      touchStartY = null;
      return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  gallery.addEventListener('touchend', (event) => {
    if (touchStartX === null || touchStartY === null || !event.changedTouches.length) return;

    const horizontalDistance = event.changedTouches[0].clientX - touchStartX;
    const verticalDistance = event.changedTouches[0].clientY - touchStartY;

    touchStartX = null;
    touchStartY = null;

    if (
      Math.abs(horizontalDistance) < swipeThreshold ||
      Math.abs(horizontalDistance) <= Math.abs(verticalDistance)
    ) return;

    suppressClickUntil = Date.now() + 500;

    if (horizontalDistance < 0) {
      showSlide(currentIndex + 1);
    } else {
      showSlide(currentIndex - 1);
    }
  }, { passive: true });

  gallery.addEventListener('touchcancel', () => {
    touchStartX = null;
    touchStartY = null;
  });

  gallery.addEventListener('click', (event) => {
    if (Date.now() >= suppressClickUntil) return;

    event.preventDefault();
    event.stopPropagation();
  }, true);

  showSlide(0);
});

document.addEventListener('shopify:variant-change', (event) => {
  const purchase = event.target.closest('[data-shopify-product]');
  const gallery = purchase
    ?.closest('.product-overview')
    ?.querySelector('[data-product-gallery]');
  const productGallery = gallery?.productGallery;
  const selectedValues = event.detail?.variant?.selectedOptions
    ?.map(option => option.value.toLowerCase());

  if (!productGallery || !selectedValues) return;

  const matchingIndex = productGallery.slides.findIndex(slide => {
    const variantValue = slide.dataset.galleryVariant?.toLowerCase();
    return variantValue && selectedValues.includes(variantValue);
  });

  if (matchingIndex >= 0) productGallery.showSlide(matchingIndex);
});
