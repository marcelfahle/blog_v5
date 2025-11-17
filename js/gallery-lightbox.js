class GalleryLightbox {
  constructor() {
    this.currentIndex = 0;
    this.images = [];
    this.lightboxElement = null;
    this.init();
  }

  init() {
    this.createLightbox();
    this.attachEventListeners();
  }

  createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox__close" aria-label="Close lightbox">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="lightbox__prev" aria-label="Previous image">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <polyline points="15,18 9,12 15,6" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="lightbox__next" aria-label="Next image">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <polyline points="9,18 15,12 9,6" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="lightbox__content">
        <img class="lightbox__image" src="" alt="">
        <div class="lightbox__caption"></div>
      </div>
      <div class="lightbox__counter"></div>
    `;
    document.body.appendChild(lightbox);
    this.lightboxElement = lightbox;
  }

  attachEventListeners() {
    document.querySelectorAll('.gallery').forEach(gallery => {
      const galleryImages = Array.from(gallery.querySelectorAll('.gallery-item'));
      
      galleryImages.forEach((item, index) => {
        const img = item.querySelector('img');
        const caption = item.querySelector('figcaption');
        
        if (img) {
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => {
            this.images = galleryImages.map(gi => ({
              src: gi.querySelector('img').src.replace(/\?.*$/, ''),
              alt: gi.querySelector('img').alt,
              caption: gi.querySelector('figcaption')?.textContent || ''
            }));
            this.open(index);
          });
        }
      });
    });

    const closeBtn = this.lightboxElement.querySelector('.lightbox__close');
    const prevBtn = this.lightboxElement.querySelector('.lightbox__prev');
    const nextBtn = this.lightboxElement.querySelector('.lightbox__next');

    closeBtn.addEventListener('click', () => this.close());
    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());

    this.lightboxElement.addEventListener('click', (e) => {
      if (e.target === this.lightboxElement) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!this.lightboxElement.classList.contains('lightbox--active')) return;
      
      switch(e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
      }
    });
  }

  open(index) {
    this.currentIndex = index;
    this.updateImage();
    this.lightboxElement.classList.add('lightbox--active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.lightboxElement.classList.remove('lightbox--active');
    document.body.style.overflow = '';
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateImage();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateImage();
  }

  updateImage() {
    const current = this.images[this.currentIndex];
    const img = this.lightboxElement.querySelector('.lightbox__image');
    const caption = this.lightboxElement.querySelector('.lightbox__caption');
    const counter = this.lightboxElement.querySelector('.lightbox__counter');

    img.src = `${current.src}?w=1920&fit=max`;
    img.alt = current.alt;
    caption.textContent = current.caption;
    counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;

    const prevBtn = this.lightboxElement.querySelector('.lightbox__prev');
    const nextBtn = this.lightboxElement.querySelector('.lightbox__next');
    
    prevBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
    nextBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
  }
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new GalleryLightbox();
  });
}
