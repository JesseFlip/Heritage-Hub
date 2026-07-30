from PIL import Image, ImageDraw
import math, os

os.makedirs("public/icons", exist_ok=True)

def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
C1=(185,28,28); C2=(249,115,22)  # brand red -> orange

def make(size, maskable=False):
    img=Image.new("RGB",(size,size))
    px=img.load()
    for y in range(size):
        for x in range(size):
            t=((x+y)/(2*size))
            px[x,y]=lerp(C1,C2,t)
    d=ImageDraw.Draw(img,"RGBA")
    cx=cy=size/2
    # safe area smaller for maskable
    scale = 0.62 if maskable else 0.78
    r=size*0.16*scale*2.2
    # draw lotus: 8 white petals as rotated ellipses
    petal_len=size*0.30*scale
    petal_w=size*0.11*scale
    for k in range(8):
        ang=math.pi*2*k/8
        layer=Image.new("RGBA",(size,size),(0,0,0,0))
        ld=ImageDraw.Draw(layer)
        ex0=cx-petal_w; ey0=cy-petal_len
        ex1=cx+petal_w; ey1=cy+ petal_w*0.4
        ld.ellipse([ex0,ey0,ex1,ey1],fill=(255,255,255,235))
        layer=layer.rotate(math.degrees(ang),center=(cx,cy),resample=Image.BICUBIC)
        img.paste(layer,(0,0),layer)
    # center circle
    cr=size*0.11*scale
    d.ellipse([cx-cr,cy-cr,cx+cr,cy+cr],fill=(255,255,255,255))
    d.ellipse([cx-cr*0.55,cy-cr*0.55,cx+cr*0.55,cy+cr*0.55],fill=(249,115,22,255))
    return img

make(192).save("public/icons/icon-192.png")
make(512).save("public/icons/icon-512.png")
make(512,maskable=True).save("public/icons/maskable-512.png")
# apple touch + favicon
make(180).save("public/icons/apple-touch-icon.png")
make(32).save("public/favicon-32.png")
print("icons written:", os.listdir("public/icons"))
