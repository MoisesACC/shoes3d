/**
 * KINETIC AIR — High-Performance Scroll-Driven Canvas Controller
 * Standard: Vanilla JS (Pinned Hero Sequence + Natural Page Continuation)
 */

const CONFIG = {
  frameCount: 100,
  lerpFactor: 0.12, // Suavizado LERP cinemático
  framePath: (index) => {
    const padded = String(index + 1).padStart(3, '0');
    return `./video-webp/frame-${padded}.webp`;
  }
};

class ScrollVideoSequence {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
    
    this.images = new Array(CONFIG.frameCount);
    this.loadedCount = 0;
    this.lastValidImage = null;

    this.targetFrame = 0;
    this.currentFrame = 0;

    // Contenedor del Hero Scroll
    this.heroWrapper = document.getElementById('heroScrollWrapper');
    
    // Pasos de texto dinámicos
    this.steps = [
      document.getElementById('step-1'),
      document.getElementById('step-2'),
      document.getElementById('step-3')
    ];

    // Elementos de Preloader
    this.loader = document.getElementById('loader');
    this.loaderBar = document.getElementById('loader-bar');
    this.loaderProgress = document.getElementById('loader-progress');

    this.init();
  }

  async init() {
    this.handleResize();
    this.bindEvents();
    await this.preloadImages();
    this.startLoop();
  }

  /**
   * Soporte Retina / High-DPI y escalado de Canvas
   */
  handleResize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.lastValidImage) {
      this.renderFrame(this.lastValidImage);
    }
  };

  /**
   * Preload Asíncrono de los 100 frames WebP
   */
  preloadImages() {
    return new Promise((resolve) => {
      let isFirstFrameReady = false;

      for (let index = 0; index < CONFIG.frameCount; index++) {
        const img = new Image();
        img.decoding = 'async';

        img.onload = () => {
          this.images[index] = img;
          this.loadedCount++;

          if (!isFirstFrameReady && index === 0) {
            this.lastValidImage = img;
            this.renderFrame(img);
            isFirstFrameReady = true;
          }

          const percent = Math.round((this.loadedCount / CONFIG.frameCount) * 100);
          if (this.loaderBar) this.loaderBar.style.width = `${percent}%`;
          if (this.loaderProgress) this.loaderProgress.textContent = `${percent}%`;

          // Liberar el loader al alcanzar al menos el 25% para interactividad inmediata
          if (this.loadedCount >= Math.floor(CONFIG.frameCount * 0.25)) {
            if (this.loader && !this.loader.classList.contains('loaded')) {
              this.loader.classList.add('loaded');
            }
          }

          if (this.loadedCount === CONFIG.frameCount) {
            if (this.loader) this.loader.classList.add('loaded');
            resolve();
          }
        };

        img.onerror = () => {
          console.warn(`[FramePreload] Error al cargar frame índice: ${index}`);
          this.images[index] = null;
          this.loadedCount++;
          if (this.loadedCount === CONFIG.frameCount) {
            if (this.loader) this.loader.classList.add('loaded');
            resolve();
          }
        };

        img.src = CONFIG.framePath(index);
      }
    });
  }

  /**
   * Renderizado 'object-fit: cover' centrado milimétricamente
   */
  renderFrame(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const drawX = (canvasWidth - drawWidth) * 0.5;
    const drawY = (canvasHeight - drawHeight) * 0.5;

    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  /**
   * Mapeo de Scroll acotado al Hero Scroll Wrapper
   */
  onScroll = () => {
    if (!this.heroWrapper) return;

    const scrollY = window.scrollY;
    const wrapperTop = this.heroWrapper.offsetTop;
    const wrapperHeight = this.heroWrapper.offsetHeight;
    const windowHeight = window.innerHeight;

    // Distancia total de scroll disponible para recorrer la secuencia
    const totalScrollableDistance = wrapperHeight - windowHeight;

    if (totalScrollableDistance <= 0) return;

    // Fracción acotada estrictamente entre 0 y 1 dentro del contenedor Hero
    const relativeScroll = scrollY - wrapperTop;
    const scrollFraction = Math.max(0, Math.min(1, relativeScroll / totalScrollableDistance));

    this.targetFrame = scrollFraction * (CONFIG.frameCount - 1);

    // Cambio de pasos de texto según el progreso del Hero
    this.updateStageSteps(scrollFraction);
  };

  /**
   * Sincronización de tarjetas de texto según el punto de rotación
   */
  updateStageSteps(fraction) {
    let activeIndex = 0;
    if (fraction < 0.33) {
      activeIndex = 0;
    } else if (fraction < 0.68) {
      activeIndex = 1;
    } else {
      activeIndex = 2;
    }

    this.steps.forEach((step, idx) => {
      if (step) {
        if (idx === activeIndex) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      }
    });
  }

  /**
   * Bucle LERP con requestAnimationFrame
   */
  startLoop = () => {
    const update = () => {
      const diff = this.targetFrame - this.currentFrame;
      this.currentFrame += diff * CONFIG.lerpFactor;

      const frameIndex = Math.round(this.currentFrame);
      const targetImage = this.images[frameIndex];

      if (targetImage && targetImage.complete && targetImage.naturalWidth > 0) {
        this.lastValidImage = targetImage;
        this.renderFrame(targetImage);
      } else if (this.lastValidImage) {
        this.renderFrame(this.lastValidImage);
      }

      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  bindEvents() {
    window.addEventListener('scroll', this.onScroll, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(this.handleResize, 40);
    }, { passive: true });
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  new ScrollVideoSequence('frameCanvas');
});
