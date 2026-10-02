# ANTMANWEB

Portafolio personal de **Diddier Santiago Contreras** — un viaje de escala inspirado en Ant-Man: del tamaño real al Reino Cuántico.

## Qué incluye

- **Quantum Field**: un túnel de miles de partículas en WebGL con shaders GLSL escritos a mano (`assets/js/quantum.js`), que reacciona al ratón, a la velocidad del scroll y a cada sección.
- **Intro con loader** cinematográfico y títulos que aparecen letra por letra.
- **Scale Dive**: una sección fija en la que el scroll te lleva de 1 m a la escala de Planck.
- **HUD** con la escala actual, el progreso y la sección.
- Scroll suave (Lenis), coreografía con GSAP + ScrollTrigger, proyectos con scroll horizontal, tarjetas 3D con tilt, botones magnéticos, cursor personalizado, marquee con inercia y texto scramble.
- **Proyectos reales** con vista previa en vídeo al pasar el ratón: Luisa (agente IA + CRM), AURELIA (showroom 3D), Épiko Torre 2, Edificio Praga, San Pablo, BenStar y JPME, más un **Laboratorio** con bots, herramientas y experimentos.
- Easter egg: haz clic en Ant-Man o pulsa **Q** para encoger toda la web.
- Responsive, sin dependencias de build y con soporte para `prefers-reduced-motion`.

## Estructura

```
index.html            → contenido (textos, proyectos, enlaces)
assets/css/main.css   → estilos y diseño
assets/js/main.js     → animaciones e interacciones
assets/js/quantum.js  → motor de partículas WebGL
assets/vendor/        → GSAP, ScrollTrigger y Lenis (copias locales)
assets/img/           → imágenes (assets/img/work: miniaturas de proyectos)
assets/video/         → vistas previas de proyectos (WebM + MP4)
```

## Editar contenido

Todo el texto está en `index.html`. Para añadir un proyecto, duplica un bloque `<article class="pcard">` en la sección de proyectos y cambia el título, la descripción, los datos, los tags, el enlace, los colores (`--a` y `--b`) y la imagen/vídeo. Los proyectos privados usan `<div class="pcard__link">` en lugar de `<a>`.

## Verla en local

Es una web estática: abre `index.html` o sirve la carpeta, por ejemplo:

```bash
python3 -m http.server 8000
```
