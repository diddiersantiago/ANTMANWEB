# ANTMANWEB

Portafolio personal de **Diddier Santiago** — desarrollo web, agentes de IA y audiovisual.

> Las grandes ideas empiezan siendo diminutas.

🔗 **[antmanweb.vercel.app](https://antmanweb.vercel.app)**

---

## Qué es

Un sitio de una sola página, sin frameworks ni proceso de compilación: HTML, CSS y
JavaScript a pelo. La idea es un viaje de escala inspirado en Ant-Man — de un humano
al Reino Cuántico — que sirve de hilo entre las secciones.

Secciones: inicio · manifiesto · viaje de escala · sobre mí · stack · proyectos ·
audiovisual · trayecto · contacto.

## Cómo está hecho

| Pieza | Con qué |
|---|---|
| Fondo de partículas | WebGL y shaders GLSL escritos a mano, sin librerías 3D |
| Animación por scroll | GSAP + ScrollTrigger |
| Scroll suave | Lenis |
| Tipografías | Syne, Inter y JetBrains Mono (Google Fonts) |
| Vídeos de las tarjetas | MP4 H.264, `preload="none"`, arrancan al pasar el cursor |

Sin dependencias instaladas: las tres librerías van versionadas en `assets/vendor/`.

## Accesibilidad y rendimiento

- Respeta `prefers-reduced-motion`: sin partículas, sin scroll suave y el viaje de
  escala se vuelve una lista vertical.
- Funciona sin JavaScript (`html.no-js`).
- Imágenes en WebP con alternativa JPG, y `width`/`height` en todas para que no
  salte la maqueta.

## Correr en local

No necesita instalar nada, solo un servidor estático:

```bash
python -m http.server 4178
```

Y abrir <http://localhost:4178>.

## Estructura

```
index.html              la página entera
assets/css/main.css     estilos
assets/js/main.js       scroll, menú, cursor, animaciones
assets/js/quantum.js    campo de partículas WebGL
assets/vendor/          gsap, ScrollTrigger, lenis
assets/img/             fotos, mascota, iconos y tarjeta para compartir
assets/video/           vistas previas de proyectos y piezas audiovisuales
tools/generar-og.py     regenera assets/img/og.png (tarjeta de Open Graph)
```

## Cómo añadir cosas

- **Un proyecto:** duplica un `<article class="pcard">` y cambia textos, cifras,
  etiquetas, colores (`--a` / `--b`), imagen o vídeo y enlace. Los proyectos sin web
  pública usan `<div class="pcard__link">` en lugar de `<a>`.
- **Una pieza audiovisual:** duplica un `<article class="avcard">`. La miniatura va en
  9:16 (540×960 WebP) y el bucle en MP4 de ~6 s sin audio.
- **La tarjeta al compartir:** `python tools/generar-og.py`.

---

© Diddier Santiago
