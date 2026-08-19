# 👟 NIKE AIR DUNK RETRO — Interactive 3D Scroll Experience (2026)

Una experiencia web inmersiva de alto impacto visual y rendimiento cinematográfico, inspirada en las landings interactivas de **Apple**, **Nike** y sitios premiados en **Awwwards**.

El proyecto implementa una secuencia de animación de producto en 360° controlada fluidamente por el scroll del usuario mediante **HTML5 Canvas**, **JavaScript Vanilla** (sin librerías pesadas como GSAP o ScrollTrigger) y assets optimizados en formato **WebP**.

---

## 📸 Vista Previa del Proyecto

- **Hero Pinned Sequence:** La animación 3D del calzado rota en el centro mientras los bloques editoriales en español (*Ingeniería Clásica*, *Cuero Premium*, *Tracción Total*) se sincronizan con la rotación.
- **Tipografía y Estética Editorial Poster:** Diseño minimalista con acentos manuscritos (*Caveat*), tipografías pesadas (*Montserrat 900*) y el eslogan característico (*Just do it.*).
- **Desbloqueo Natural de Scroll:** Al finalizar los 100 frames de la secuencia, el viewport sticky se libera suavemente dando paso a la sección de especificaciones técnicas y llamada a la acción.

---

## ⚡ Características Principales

- **🎮 Animación Ultra Fluida con LERP (Linear Interpolation):**
  - Interpolación lineal continua (`currentFrame += (targetFrame - currentFrame) * 0.12`) ejecutada en bucle con `requestAnimationFrame` para eliminar saltos bruscos en el scroll del mouse o trackpad.
- **🚀 Cero Dependencias Pesadas:**
  - Código 100% Vanilla JS, sin frameworks ni dependencias en runtime para garantizar un tiempo de carga instantáneo y puntuaciones perfectas en Core Web Vitals.
- **🖼️ Optimización Extrema de Assets (Reducción del 97.7%):**
  - Conversión de 100 frames PNG originales (**227.20 MB**) a imágenes **WebP** de alta fidelidad (**5.29 MB total**, ~54 KB por frame) con compresión optimizada (`quality: 82`, `effort: 6`, `smartSubsample`).
- **📱 Soporte Completo Retina / High-DPI:**
  - Calibración dinámica basada en `window.devicePixelRatio` con auto-escalado lógico en el contexto 2D del Canvas para evitar distorsiones o borrosidad en pantallas de alta densidad (MacBook Retina, 4K, smartphones).
- **📐 Renderizado `object-fit: cover` Milimétrico:**
  - Algoritmo de centrado y escalado proporcional automático en Canvas que mantiene intacto el aspect ratio del producto sin deformarse ante cualquier resolución o redimensionamiento de ventana.
- **🛡️ Sistema Anti-Flicker (Fallback Inteligente):**
  - Buffer de `lastValidImage` que evita parpadeos en blanco/negro si un frame experimenta retraso en el pipeline de decodificación asíncrona.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Estructura** | HTML5 Semántico |
| **Estilos & Layout** | CSS3 Moderno (Glassmorphism, CSS Sticky, Flexbox, CSS Grid) |
| **Render Engine** | HTML5 Canvas 2D API |
| **Lógica & Animación** | JavaScript ES6+ Vanilla (LERP + rAF) |
| **Assets de Video/Frames** | WebP lossy optimizado |
| **Tipografía** | Google Fonts (*Montserrat*, *Caveat*, *Inter*, *Bebas Neue*) |

---

## 📂 Estructura del Proyecto

```text
Shoes/
├── img/
│   └── nike.svg             # Logotipo vectorial oficial de Nike
├── video-webp/              # Secuencia de 100 frames en WebP (frame-001.webp .. frame-100.webp)
├── index.html               # Estructura principal, canvas fijo, overlays y secciones
├── style.css                # Sistema de diseño cinemático oscuro y responsive
├── app.js                   # Controlador del Canvas, LERP, preloader y scroll mapping
├── frames.json              # Manifiesto de frames
└── README.md                # Documentación del proyecto
```

---

## 🚀 Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/MoisesACC/shoes3d.git
   cd shoes3d
   ```

2. **Ejecutar con cualquier servidor estático local:**
   - Con Node.js / `npx`:
     ```bash
     npx serve
     ```
   - O con la extensión **Live Server** de VS Code abriendo `index.html`.

3. **Abrir en el navegador:**
   - Visita `http://localhost:3000` (o el puerto indicado por tu servidor local).

---

## ⚙️ Conversión y Optimización de Frames

Si deseas generar tus propios frames a partir de un video MP4:

```bash
# Extraer exactamente 100 frames en formato WebP con calidad 82
ffmpeg -i video.mp4 -vf "scale=1920:-1,fps=100/DURACION_EN_SEGUNDOS" -vcodec libwebp -quality 82 -compression_level 6 -preset photo video-webp/frame-%03d.webp
```

---

## 👤 Autor

Desarrollado con pasión por **[Moisés Cárdenas (MoisesACC)](https://github.com/MoisesACC)**.
