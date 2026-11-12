document.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
  const slides = Array.from(gallery.querySelectorAll('[data-gallery-slide]'));
  const previousButton = gallery.querySelector('[data-gallery-previous]');
  const nextButton = gallery.querySelector('[data-gallery-next]');
  const status = gallery.querySelector('.product-gallery-status');
  let currentIndex = 0;

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
