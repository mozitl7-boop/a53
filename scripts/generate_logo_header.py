from PIL import Image
import os

INPUT = os.path.join("public", "logo-congreso.png")
OUTPUT = os.path.join("public", "logo-congreso-header.png")

def crop_transparent_border(im, alpha_threshold=10, padding=6):
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
    pix = im.load()
    w, h = im.size
    minx, miny = w, h
    maxx, maxy = 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            if pix[x, y][3] > alpha_threshold:
                found = True
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    if not found:
        return im

    # add padding but clamp to image bounds
    minx = max(0, minx - padding)
    miny = max(0, miny - padding)
    maxx = min(w - 1, maxx + padding)
    maxy = min(h - 1, maxy + padding)

    return im.crop((minx, miny, maxx + 1, maxy + 1))

def main():
    if not os.path.exists(INPUT):
        print(f"Input not found: {INPUT}")
        return
    im = Image.open(INPUT)
    cropped = crop_transparent_border(im, alpha_threshold=8, padding=8)

    # Optionally we could resize slightly to improve legibility; keep original size to avoid distortion
    cropped.save(OUTPUT, format='PNG', optimize=True)
    print(f"Saved cropped header logo to: {OUTPUT}")

if __name__ == '__main__':
    main()
