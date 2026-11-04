# -*- coding: utf-8 -*-
"""Genera la tarjeta que se ve al compartir el enlace (Open Graph, 1200x630).
Uso:  python tools/generar-og.py
Sale: assets/img/og.png
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Carpeta con las Inter en .ttf. Se puede apuntar a otra con la variable de
# entorno OG_FONTS; si no, busca en tools/fuentes dentro del propio proyecto.
LETRAS = os.environ.get("OG_FONTS") or os.path.join(RAIZ, "tools", "fuentes")
if not os.path.isdir(LETRAS):
    raise SystemExit(
        "No encuentro las tipografias Inter. Descarga Inter de "
        "https://rsms.me/inter/ y deja los .ttf en "
        + os.path.join(RAIZ, "tools", "fuentes")
        + " o apunta a su carpeta con la variable de entorno OG_FONTS."
    )

W, H = 1200, 630
FONDO = (6, 5, 9)
ROJO = (255, 42, 61)
CIAN = (61, 242, 255)
CREMA = (242, 237, 228)
GRIS = (138, 138, 154)


def fuente(nombre, tam):
    return ImageFont.truetype(os.path.join(LETRAS, nombre), tam)


def texto_espaciado(draw, xy, txt, font, fill, tracking=0):
    """Dibuja texto letra a letra para poder apretar o abrir el interletraje."""
    x, y = xy
    for ch in txt:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x


def ancho_espaciado(draw, txt, font, tracking=0):
    return sum(draw.textlength(c, font=font) for c in txt) + tracking * max(0, len(txt) - 1)


img = Image.new("RGB", (W, H), FONDO)

# --- resplandor rojo detrás del texto ---
glow = Image.new("RGB", (W, H), FONDO)
gd = ImageDraw.Draw(glow)
gd.ellipse([-300, 180, 420, 820], fill=(58, 10, 17))
gd.ellipse([80, -240, 700, 220], fill=(18, 8, 13))
img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(170)), 0.62)

d = ImageDraw.Draw(img)

# --- foto a la derecha, con el mismo trato que en la página ---
ruta_foto = os.path.join(RAIZ, "assets", "img", "diddier.jpg")
if os.path.exists(ruta_foto):
    marco_w, marco_h = 360, 470
    fx, fy = W - marco_w - 80, (H - marco_h) // 2
    foto = Image.open(ruta_foto).convert("RGB")
    escala = max(marco_w / foto.width, marco_h / foto.height)
    foto = foto.resize((int(foto.width * escala), int(foto.height * escala)), Image.LANCZOS)
    izq = (foto.width - marco_w) // 2
    arr = int((foto.height - marco_h) * 0.18)          # sube el encuadre hacia la cara
    foto = foto.crop((izq, arr, izq + marco_w, arr + marco_h))

    gris = foto.convert("L").convert("RGB")
    foto = Image.blend(foto, gris, 0.8)
    velo = Image.new("RGB", (marco_w, marco_h), FONDO)
    foto = Image.blend(foto, velo, 0.12)

    # degradado inferior + tinte rojo/cian, como el ::after del sitio
    cap = Image.new("RGB", (marco_w, marco_h))
    cd = ImageDraw.Draw(cap)
    for y in range(marco_h):
        t = max(0.0, (y / marco_h - 0.45) / 0.55)
        mezcla = int(255 * (t ** 1.6))
        cd.line([(0, y), (marco_w, y)], fill=(mezcla, mezcla, mezcla))
    foto = Image.composite(Image.new("RGB", (marco_w, marco_h), FONDO), foto, cap.convert("L"))

    mascara = Image.new("L", (marco_w, marco_h), 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, marco_w - 1, marco_h - 1], radius=26, fill=255)
    img.paste(foto, (fx, fy), mascara)

    borde = ImageDraw.Draw(img)
    borde.rounded_rectangle([fx, fy, fx + marco_w - 1, fy + marco_h - 1], radius=26,
                            outline=(60, 58, 70), width=1)

d = ImageDraw.Draw(img)
X = 80

# --- etiqueta superior ---
f_label = fuente("Inter-SemiBold.ttf", 19)
texto_espaciado(d, (X, 92), "// PORTAFOLIO — 2026", f_label, ROJO, tracking=2.4)

# --- nombre ---
f_nom = fuente("InterDisplay-Black.ttf", 104)
d.text((X - 4, 150), "DIDDIER", font=f_nom, fill=CREMA)
# segunda línea en contorno, como el hero de la página
d.text((X - 4, 252), "SANTIAGO", font=f_nom, fill=FONDO,
       stroke_width=2, stroke_fill=(150, 148, 160))

# --- línea separadora ---
d.line([(X, 392), (X + 560, 392)], fill=(48, 46, 56), width=1)

# --- qué hace ---
f_sub = fuente("Inter-Medium.ttf", 26)
d.text((X, 420), "Desarrollo web · Agentes de IA", font=f_sub, fill=GRIS)
d.text((X, 458), "3D en el navegador · Audiovisual", font=f_sub, fill=GRIS)

# --- url ---
f_url = fuente("Inter-SemiBold.ttf", 21)
texto_espaciado(d, (X, 520), "antmanweb.vercel.app", f_url, CIAN, tracking=1.6)

# --- mascota pequeña abajo a la izquierda ---
ruta_ant = os.path.join(RAIZ, "assets", "img", "antman.png")
if os.path.exists(ruta_ant):
    ant = Image.open(ruta_ant).convert("RGBA")
    ant.thumbnail((132, 132), Image.LANCZOS)
    img.paste(ant, (X + 470, H - 46 - ant.height), ant)

# --- filete de marca abajo ---
d.rectangle([0, H - 6, W, H], fill=ROJO)
d.rectangle([0, H - 6, 300, H], fill=CIAN)

salida = os.path.join(RAIZ, "assets", "img", "og.png")
img.save(salida, optimize=True)
print("listo:", salida, img.size, str(os.path.getsize(salida) // 1024) + " KB")
