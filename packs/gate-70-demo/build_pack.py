from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
import qrcode, zipfile

ROOT=Path(__file__).parent; A=ROOT/'assets'; D=ROOT/'downloads'; D.mkdir(exist_ok=True)
URL='http://localhost:8000/packs/gate-70-demo/'
CREAM='#f4ead1'; NAVY='#071827'; GOLD='#bc8e3e'; INK='#071827'
cards=[('001','LONDON 1966','The Summer of Champions','Classic Route','london-1966.png','CLASSIC'),('002','MOON 1969','From Imagination to Destination','Impossible Route','moon-1969.png','IMPOSSIBLE'),('003','MEXICO 1970','One Goal. Fifty Years of Memory.','National Memory','mexico-1970.png','MEMORY'),('004','TOKYO TO TORENZA','Gate 70','Vintage Route','tokyo-torenza.png','VINTAGE'),('005','GATE 70','Beyond the Map','Rare Secret','gate-70.png','RARE')]
def font(size,b=False):
    paths=['C:/Windows/Fonts/georgiab.ttf' if b else 'C:/Windows/Fonts/georgia.ttf','C:/Windows/Fonts/arial.ttf']
    for p in paths:
        if Path(p).exists(): return ImageFont.truetype(p,size)
    return ImageFont.load_default()
def center(draw,xy,text,f,fill):
    box=draw.textbbox((0,0),text,font=f); draw.text((xy[0]-(box[2]-box[0])/2,xy[1]),text,font=f,fill=fill)
def card_front(c):
    im=Image.new('RGB',(900,1350),CREAM); d=ImageDraw.Draw(im); d.rectangle((24,24,876,1326),outline=GOLD,width=7)
    art=Image.open(A/c[4]).convert('RGB'); art.thumbnail((820,860)); x=(900-art.width)//2; im.paste(art,(x,55)); d.rectangle((x,55,x+art.width,55+art.height),outline=NAVY,width=3)
    y=945; d.text((55,y),'AIR TORENZA',font=font(30,True),fill=NAVY); d.text((55,y+58),c[1],font=font(55,True),fill=NAVY); d.text((55,y+127),c[2],font=font(25),fill='#72552a'); d.line((55,y+184,845,y+184),fill=GOLD,width=3); d.text((55,y+207),f'CARD {c[0]}  ·  {c[3].upper()}',font=font(23,True),fill=NAVY); d.ellipse((735,1168,840,1273),fill=NAVY,outline=GOLD,width=4); center(d,(787,1198),'✦' if c[5]=='RARE' else c[5][0],font(42,True),GOLD)
    return im
def card_back():
    im=Image.new('RGB',(900,1350),NAVY); d=ImageDraw.Draw(im); d.rectangle((28,28,872,1322),outline=GOLD,width=8); d.rectangle((48,48,852,1302),outline=GOLD,width=2); d.ellipse((170,360,730,920),outline=GOLD,width=12); d.ellipse((205,395,695,885),outline=GOLD,width=3); center(d,(450,475),'AIR TORENZA',font(45,True),CREAM); center(d,(450,575),'70',font(180,True),GOLD); center(d,(450,735),'GATE',font(35,True),CREAM); center(d,(450,1160),'FROM IMAGINATION TO DESTINATION',font(25),GOLD); return im
fronts=[]
for c in cards:
    p=D/f'AIR_TORENZA_CARD_{c[0]}.png'; card_front(c).save(p,optimize=True); fronts.append(p)
back=D/'AIR_TORENZA_CARD_BACK.png'; card_back().save(back,optimize=True)
def simple_png(name,title,subtitle,kind):
    im=Image.new('RGB',(1600,900),CREAM); d=ImageDraw.Draw(im); d.rectangle((35,35,1565,865),outline=NAVY,width=7); d.rectangle((55,55,1545,845),outline=GOLD,width=3); d.text((90,80),'AIR TORENZA',font=font(45,True),fill=NAVY); d.text((1240,75),'GATE 70',font=font(42,True),fill=GOLD); center(d,(800,200),title,font(75,True),NAVY); center(d,(800,300),subtitle,font(31),GOLD)
    if kind=='pass':
        d.line((190,470,1410,470),fill=NAVY,width=4); d.text((210,515),'PASSENGER  THE COLLECTOR',font=font(35,True),fill=NAVY); d.text((210,590),'ROUTE  IMAGINATION → DESTINATION',font=font(32),fill=NAVY); d.text((1090,515),'GATE',font=font(25),fill=NAVY); d.text((1140,570),'70',font=font(100,True),fill=GOLD)
    else:
        d.line((240,640,1350,400),fill=GOLD,width=10); pts=[(250,640,'LONDON'),(520,580,'MEXICO'),(770,525,'TOKYO'),(1030,470,'MOON'),(1340,402,'GATE 70')]
        for x,y,t in pts: d.ellipse((x-18,y-18,x+18,y+18),fill=NAVY); d.text((x-50,y+30),t,font=font(22,True),fill=NAVY)
    p=D/name; im.save(p,optimize=True); return p
boarding=simple_png('AIR_TORENZA_BOARDING_PASS.png','BOARDING PASS','FLIGHT AT-70 · GUARANTEED DEPARTURE','pass'); route=simple_png('AIR_TORENZA_ROUTE_MAP.png','ROUTE MAP','FIVE STOPS BEYOND THE ORDINARY','route')
def pdf_page(c,title,sub=''):
    w,h=A4;c.setFillColor(HexColor(CREAM));c.rect(0,0,w,h,fill=1,stroke=0);c.setStrokeColor(HexColor(GOLD));c.setLineWidth(2);c.rect(28,28,w-56,h-56);c.setFillColor(HexColor(NAVY));c.setFont('Helvetica-Bold',13);c.drawString(45,h-55,'AIR TORENZA');c.setFillColor(HexColor(GOLD));c.drawRightString(w-45,h-55,'GATE 70');c.setFillColor(HexColor(NAVY));c.setFont('Times-Bold',30);c.drawCentredString(w/2,h-120,title);c.setFont('Helvetica',11);c.setFillColor(HexColor(GOLD));c.drawCentredString(w/2,h-145,sub)
check=D/'AIR_TORENZA_COLLECTOR_CHECKLIST.pdf'; c=canvas.Canvas(str(check),pagesize=A4);pdf_page(c,'COLLECTOR CHECKLIST','GATE 70 DIGITAL FLIGHT PACK'); y=620
for x in cards:c.setStrokeColor(HexColor(GOLD));c.rect(80,y-4,14,14);c.setFillColor(HexColor(NAVY));c.setFont('Helvetica-Bold',12);c.drawString(110,y,f"CARD {x[0]}  {x[1]}");c.setFont('Helvetica',9);c.drawString(110,y-17,x[3]);y-=76
c.setFont('Helvetica',8);c.drawCentredString(A4[0]/2,55,'FROM IMAGINATION TO DESTINATION');c.save()
pack=D/'AIR_TORENZA_GATE70_DEMO_PACK.pdf';c=canvas.Canvas(str(pack),pagesize=A4)
pdf_page(c,'GATE 70 DIGITAL FLIGHT PACK','FIVE GUARANTEED COLLECTIBLE ROUTES');c.setFont('Times-Italic',16);c.drawCentredString(A4[0]/2,400,'FROM IMAGINATION TO DESTINATION');c.showPage()
for i,p in enumerate(fronts):pdf_page(c,f'CARD {cards[i][0]}',cards[i][1]);c.drawImage(ImageReader(str(p)),132,75,width=330,height=495,preserveAspectRatio=True);c.showPage()
for title,p in [('BOARDING PASS',boarding),('ROUTE MAP',route)]:pdf_page(c,title,'GATE 70');c.drawImage(ImageReader(str(p)),55,230,width=485,height=273,preserveAspectRatio=True);c.showPage()
pdf_page(c,'COLLECTOR CHECKLIST','ALL FIVE ROUTES INCLUDED');y=590
for x in cards:c.setFont('Helvetica-Bold',12);c.drawString(105,y,f"✓  CARD {x[0]}  {x[1]}");y-=55
c.showPage();pdf_page(c,'WELCOME BEYOND THE MAP','YOUR FLIGHT PACK IS OPEN');c.setFont('Times-Italic',17);c.drawCentredString(A4[0]/2,390,'FROM IMAGINATION TO DESTINATION');c.save()
z=D/'AIR_TORENZA_GATE70_DEMO_CARDS.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as out:
    for p in [*fronts,back,boarding,route,check]:out.write(p,p.name)
access=ROOT/'AIR_TORENZA_GATE70_OPEN_YOUR_PACK_DEMO.pdf';qr=qrcode.make(URL);qrp=D/'gate70-qr.png';qr.save(qrp)
c=canvas.Canvas(str(access),pagesize=A4);pdf_page(c,'GATE 70 DIGITAL FLIGHT PACK','YOUR FLIGHT PACK IS READY.');c.setFont('Helvetica',12);c.setFillColor(HexColor(NAVY));c.drawString(100,600,'Inside:');items=['5 Digital Flight Cards','1 Boarding Pass','1 Route Map','1 Collector Checklist','A chance to discover Gate 70'];y=575
for x in items:c.drawString(120,y,'•  '+x);y-=24
c.setFillColor(HexColor(NAVY));c.roundRect(175,370,245,48,5,fill=1,stroke=0);c.setFillColor(HexColor(CREAM));c.setFont('Helvetica-Bold',13);c.drawCentredString(A4[0]/2,388,'OPEN YOUR PACK');c.linkURL(URL,(175,370,420,418),relative=0);c.drawImage(str(qrp),245,210,105,105);c.linkURL(URL,(245,210,350,315),relative=0);c.setFillColor(HexColor(NAVY));c.setFont('Helvetica',10);c.drawCentredString(A4[0]/2,185,'Scan the QR code or click the button to begin.');c.setFont('Helvetica-Bold',9);c.drawCentredString(A4[0]/2,55,'FROM IMAGINATION TO DESTINATION');c.save()
print('\n'.join(str(x) for x in [access,z,pack]))
