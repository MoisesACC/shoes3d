const COLORWAYS = {
  azul: {
    name: 'Azul Royal',
    accent: '#4388cc',
    folder: './video-webp-azul'
  },
  marron: {
    name: 'Marrón Vintage',
    accent: '#9c6d48',
    folder: './video-webp-marron'
  },
  chicle: {
    name: 'Rosa Chicle',
    accent: '#e26d9c',
    folder: './video-webp-chicle'
  },
  negro: {
    name: 'Negro Onix',
    accent: '#888888',
    folder: './video-webp-negro'
  }
};

const CONFIG = {
  frameCount: 100,
  lerpFactor: 0.12, // Suavizado LERP cinemático
  currentColor: 'azul',
  framePath: (index, colorKey = CONFIG.currentColor) => {
    const padded = String(index + 1).padStart(3, '0');
    const folder = COLORWAYS[colorKey] ? COLORWAYS[colorKey].folder : './video-webp-azul';
    return `${folder}/frame-${padded}.webp`;
  }
};

class ScrollVideoSequence {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });

    // Almacenamiento en caché por color: { azul: [...], marron: [...] }
    this.colorwayCaches = {};
    this.currentColor = 'azul';
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

    // Elementos del selector de color
    this.swatches = document.querySelectorAll('.color-swatch');
    this.activeColorNameEl = document.getElementById('activeColorName');

    this.init();
  }

  async init() {
    this.handleResize();
    this.bindEvents();
    this.initColorSelector();
    await this.preloadImages(this.currentColor, true);
    this.startLoop();

    // Precargar en segundo plano el color alternativo para cambio instantáneo
    this.preloadAlternativeColors();
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
   * Preload Asíncrono de los 100 frames WebP con createImageBitmap (Off-thread decoding)
   */
  preloadImages(colorKey, isInitial = false) {
    if (this.colorwayCaches[colorKey]) {
      this.images = this.colorwayCaches[colorKey];
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const imgArray = new Array(CONFIG.frameCount);
      let count = 0;
      let isFirstFrameReady = false;

      // Soporte moderno para createImageBitmap (decodificación fuera del hilo principal)
      const supportsImageBitmap = typeof window.createImageBitmap === 'function';

      const checkCompletion = () => {
        if (count === CONFIG.frameCount) {
          this.colorwayCaches[colorKey] = imgArray;
          if (isInitial) {
            if (this.loader) this.loader.classList.add('loaded');
            this.images = imgArray;
          }
          resolve();
        }
      };

      const loadSingleFrame = async (index) => {
        const url = CONFIG.framePath(index, colorKey);
        try {
          if (supportsImageBitmap) {
            const response = await fetch(url);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob, { imageOrientation: 'none', premultiplyAlpha: 'none' });
            imgArray[index] = bitmap;
          } else {
            await new Promise((imgResolve, imgReject) => {
              const img = new Image();
              img.decoding = 'async';
              img.onload = () => {
                imgArray[index] = img;
                imgResolve();
              };
              img.onerror = imgReject;
              img.src = url;
            });
          }

          count++;

          if (isInitial) {
            if (!isFirstFrameReady && index === 0 && imgArray[0]) {
              this.lastValidImage = imgArray[0];
              this.renderFrame(imgArray[0]);
              isFirstFrameReady = true;
            }

            const percent = Math.round((count / CONFIG.frameCount) * 100);
            if (this.loaderBar) this.loaderBar.style.width = `${percent}%`;
            if (this.loaderProgress) this.loaderProgress.textContent = `${percent}%`;

            if (count >= Math.floor(CONFIG.frameCount * 0.25)) {
              if (this.loader && !this.loader.classList.contains('loaded')) {
                this.loader.classList.add('loaded');
              }
            }
          }
        } catch (err) {
          console.warn(`[FramePreload] Error cargando frame ${index} (${colorKey}):`, err);
          imgArray[index] = null;
          count++;
        } finally {
          checkCompletion();
        }
      };

      // Cargar los primeros 15 frames con alta prioridad
      for (let i = 0; i < Math.min(15, CONFIG.frameCount); i++) {
        loadSingleFrame(i);
      }
      // Cargar el resto de forma escalonada para no saturar la red simultáneamente
      for (let i = 15; i < CONFIG.frameCount; i++) {
        loadSingleFrame(i);
      }
    });
  }

  /**
   * Precarga en segundo plano para transiciones instantáneas
   */
  preloadAlternativeColors() {
    // Usar requestIdleCallback para no competir con el scroll inicial
    const schedulePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));

    schedulePreload(() => {
      Object.keys(COLORWAYS).forEach((key) => {
        if (key !== this.currentColor && !this.colorwayCaches[key]) {
          this.preloadImages(key, false);
        }
      });
    });
  }

  /**
   * Selector interactivo de colorway
   */
  initColorSelector() {
    if (!this.swatches || this.swatches.length === 0) return;

    this.swatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.color;
        if (!color || color === this.currentColor) return;

        this.switchColor(color);
      });
    });
  }

  /**
   * Cambia la secuencia de frames de forma fluida
   */
  async switchColor(colorKey) {
    if (!COLORWAYS[colorKey]) return;

    this.currentColor = colorKey;
    CONFIG.currentColor = colorKey;

    // Actualizar botones UI
    this.swatches.forEach((s) => {
      if (s.dataset.color === colorKey) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });

    if (this.activeColorNameEl && COLORWAYS[colorKey]) {
      this.activeColorNameEl.textContent = COLORWAYS[colorKey].name;
    }

    // Actualizar variable CSS de acento
    if (COLORWAYS[colorKey].accent) {
      document.documentElement.style.setProperty('--nike-accent', COLORWAYS[colorKey].accent);
    }

    // Si ya está en caché, cambio inmediato
    if (this.colorwayCaches[colorKey]) {
      this.images = this.colorwayCaches[colorKey];
      const frameIndex = Math.min(CONFIG.frameCount - 1, Math.max(0, Math.round(this.currentFrame)));
      const newImg = this.images[frameIndex] || this.images[0];
      if (newImg) {
        this.lastValidImage = newImg;
        this.renderFrame(newImg);
        this.requestRender();
      }
    } else {
      await this.preloadImages(colorKey, false);
      this.images = this.colorwayCaches[colorKey];
      const frameIndex = Math.min(CONFIG.frameCount - 1, Math.max(0, Math.round(this.currentFrame)));
      const newImg = this.images[frameIndex] || this.images[0];
      if (newImg) {
        this.lastValidImage = newImg;
        this.renderFrame(newImg);
        this.requestRender();
      }
    }
  }

  /**
   * Renderizado 'object-fit: cover' centrado milimétricamente
   */
  renderFrame(img) {
    if (!img) return;

    const imgWidth = img.width || img.naturalWidth;
    const imgHeight = img.height || img.naturalHeight;
    if (!imgWidth || !imgHeight) return;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

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

    // Despertar el loop si estaba en reposo
    this.requestRender();
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
   * Reactiva el bucle si está pausado
   */
  requestRender = () => {
    if (!this.isLoopRunning) {
      this.isLoopRunning = true;
      requestAnimationFrame(this.renderLoop);
    }
  };

  /**
   * Bucle LERP inteligente: se pausa automáticamente cuando converge (Idle Pause)
   * Ahorra batería y ciclos de GPU manteniendo 60/120 FPS ultra fluidos en movimiento.
   */
  renderLoop = () => {
    const diff = this.targetFrame - this.currentFrame;

    // Si la diferencia es casi nula, detenemos el loop para ahorrar 100% CPU/GPU en reposo
    if (Math.abs(diff) < 0.002) {
      this.currentFrame = this.targetFrame;
      const frameIndex = Math.min(CONFIG.frameCount - 1, Math.max(0, Math.round(this.currentFrame)));
      const targetImage = this.images[frameIndex];
      if (targetImage) {
        this.lastValidImage = targetImage;
        this.renderFrame(targetImage);
      }
      this.isLoopRunning = false;
      return;
    }

    this.currentFrame += diff * CONFIG.lerpFactor;

    const frameIndex = Math.min(CONFIG.frameCount - 1, Math.max(0, Math.round(this.currentFrame)));
    const targetImage = this.images[frameIndex];

    if (targetImage) {
      this.lastValidImage = targetImage;
      this.renderFrame(targetImage);
    } else if (this.lastValidImage) {
      this.renderFrame(this.lastValidImage);
    }

    requestAnimationFrame(this.renderLoop);
  };

  startLoop = () => {
    this.requestRender();
  };

  bindEvents() {
    window.addEventListener('scroll', this.onScroll, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.handleResize();
        this.requestRender();
      }, 40);
    }, { passive: true });
  }
}

/**
 * Controlador de la Sección Studio Stage
 * Sincroniza el foco de iluminación ambiental, interacción y paginación en móvil
 */
class StudioCinematicController {
  constructor() {
    this.stage = document.getElementById('sec-studio');
    if (!this.stage) return;

    this.row = this.stage.querySelector('.studio-shoes-row');
    this.pods = this.stage.querySelectorAll('.studio-shoe-pod');
    this.dots = this.stage.querySelectorAll('.studio-dot');

    this.init();
  }

  init() {
    this.pods.forEach((pod, index) => {
      pod.addEventListener('mouseenter', () => {
        this.setActivePod(pod, index);
      });

      pod.addEventListener('click', () => {
        this.setActivePod(pod, index);
      });
    });

    // Clic en los dots de paginación para móvil
    this.dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const targetIdx = parseInt(dot.dataset.index, 10);
        if (this.pods[targetIdx] && this.row) {
          const podWidth = this.row.offsetWidth;
          this.row.scrollTo({
            left: podWidth * targetIdx,
            behavior: 'smooth'
          });
          this.setActivePod(this.pods[targetIdx], targetIdx);
        }
      });
    });

    // Detectar deslizamiento en móvil y actualizar el dot activo
    if (this.row) {
      this.row.addEventListener('scroll', () => {
        const scrollLeft = this.row.scrollLeft;
        const podWidth = this.row.offsetWidth;
        if (podWidth > 0) {
          const activeIndex = Math.round(scrollLeft / podWidth);
          this.updateDots(activeIndex);
          if (this.pods[activeIndex]) {
            this.pods.forEach((p) => p.classList.remove('active'));
            this.pods[activeIndex].classList.add('active');
          }
        }
      }, { passive: true });
    }
  }

  setActivePod(activePod, index) {
    this.pods.forEach((p) => p.classList.remove('active'));
    activePod.classList.add('active');
    this.updateDots(index);
  }

  updateDots(index) {
    this.dots.forEach((dot, idx) => {
      if (idx === index) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  new ScrollVideoSequence('frameCanvas');
  new StudioCinematicController();
});
