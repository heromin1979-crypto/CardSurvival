from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage
import heapq, json

FULL=Image.open('assets/images/ui/minimap-map/seoul-blueprint-map-final00-clean.png').convert('RGB')
FW,FH=FULL.size; DS=2
im=FULL.resize((FW//DS,FH//DS)); a=np.asarray(im).astype(float)
H,W,_=a.shape; bright=a.sum(2); S=4.0/DS
def P(x,y): return (int(round(x*S)),int(round(y*S)))

# Han river band, hand-traced against the artwork (688-space centerline).
# NW arm first, then the main course dipping under Yongsan and rising NE past
# Gangdong. Painted wide enough to cover the water between the bank lines.
river=[(132,102),(150,122),(170,140),(190,158),(210,176),(230,194),(245,206),
       (258,219),(280,221),(300,230),(320,237),(340,248),(360,257),(380,262),
       (395,261),(410,255),(425,247),(440,235),(455,225),(470,215),(485,205),
       (500,196),(515,183),(530,172),(545,163),(560,155)]
# extra water strokes (688-space, (points, width)): the confluence pocket east of
# Yeouido is wider than RIVER_W. The narrow south channel (샛강) is intentionally
# NOT painted so the island stays connected to (and owned by) Yeongdeungpo.
WATER=[([(302,231),(308,233),(314,236)],36),
       ([(314,236),(321,240),(328,243),(333,244)],24),
       # NW-arm lower reach along Mapo: the channel is ~50 px wide there, wider
       # than RIVER_W — cover it fully so Mapo's edge lands on its bank line
       # (overshoot into land cells is returned by extract's reclaim step)
       ([(208,172),(215,178),(223,182),(230,186),(238,190),(245,195),(253,200)],46)]
# manual seal strokes (688-space) for borders drawn with gaps in the artwork:
# - Geumcheon|Gwanak border (gap lets Gwanak flood into Geumcheon's south lobe)
# - Gangseo west-coast gap (would drain the NW land region into the margin and
#   exclude Mapo/Gangseo from the fill_holes silhouette)
MANUAL=[[(272,283),(271,300),(271,313),(272,325),(275,336),(277,346),(275,352)],
        [(88,188),(102,200)],
        [(146,221),(153,228),(163,227),(173,230)],   # Gangseo|Yangcheon west section only —
                                # east of x=346 the border is the bright outline
                                # of Gangseo's hatched pentagon lobe (cell-snapped;
                                # extract force-assigns the lobe cell to Gangseo)
        [(130,110),(116,127)],  # NW-arm exit seal: closes the arm channel into a
                                # cell so extract's water-cell snap can claim it
        [(222,261),(224,264),(226,268),(229,272),(231,276),(233,280),(235,284),(237,287)]]
                                # Guro|Yeongdeungpo (도림천 — drawn as a faint
                                # double stream line, too dim for the wall mask)
bim=Image.new('L',(W,H),0); bd=ImageDraw.Draw(bim)
RIVER_W=30
# NOTE: only MANUAL seals go into bim — the river contributes via the FINAL
# waterband below (hand band + bank-tracked replacement). Drawing the raw hand
# polyline here too would leave the drifted east course as a stray flood barrier.
for poly in MANUAL: bd.line([P(*p) for p in poly],fill=255,width=6,joint='curve')
drawn=np.asarray(bim)>0

# widen the river band to the REAL water. The hand path drifts on the east half,
# so TRACK the channel: seed at a verified water point and march column by column,
# snapping to the nearest bank line above/below the running center.
_wallpx=bright>320
def _track(x0,c0,x1):
    step=1 if x1>=x0 else -1
    cs={}
    c=c0
    for _x in range(x0,x1,step):
        top=bot=None
        for _d in range(3,52):
            if top is None and c-_d>=0 and _wallpx[int(c)-_d,_x]: top=int(c)-_d
            if bot is None and c+_d<H and _wallpx[int(c)+_d,_x]: bot=int(c)+_d
            if top is not None and bot is not None: break
        if top is not None and bot is not None and 12<bot-top<55:
            c=(top+bot)/2.0
            cs[_x]=(top,bot)
    return cs
_bank={}
_bank.update(_track(830,442,1126))
# backward pass stops at x=680: west of that is the Yeouido confluence, where the
# island's bright ring roads hijack the bank lock-on. Hand polyline+WATER cover it.
_bank.update(_track(830,442,679))
def _medband(bank,k=10):
    xs=sorted(bank)
    tops=np.array([bank[x][0] for x in xs],float)
    bots=np.array([bank[x][1] for x in xs],float)
    def med(a):
        o=a.copy()
        for i in range(len(a)):
            o[i]=np.median(a[max(0,i-k):i+k+1])
        return o
    return xs,med(tops),med(bots)
_wonly=Image.new('L',(W,H),0)
_wd=ImageDraw.Draw(_wonly)
_wd.line([P(*p) for p in river],fill=255,width=RIVER_W,joint='curve')
for _pts,_wdt in WATER: _wd.line([P(*p) for p in _pts],fill=255,width=_wdt,joint='curve')
waterband=np.asarray(_wonly)>0
# drop the hand band on the tracked sections (it drifts there), then add tracked
# fill; interpolate over untracked columns so bridges/faint banks leave no holes
def _apply_track(bank):
    global waterband
    _xs,_tops,_bots=_medband(bank)
    if _xs:
        waterband[:, min(_xs):max(_xs)+1]=False
        _ax=np.arange(min(_xs),max(_xs)+1)
        _ti=np.interp(_ax,_xs,_tops); _bi=np.interp(_ax,_xs,_bots)
        for _i,_x in enumerate(_ax):
            waterband[int(_ti[_i])+1:int(_bi[_i]),_x]=True
_apply_track(_bank)
drawn=drawn|waterband

# silhouette: fill the boundary network WITH the river band plugged in, so land
# that touches the water through a bank gap still counts as enclosed city.
wall=bright>315; m=38
wall[:m,:]=0;wall[-m:,:]=0;wall[:,:m]=0;wall[:,-m:]=0
wall=ndimage.binary_dilation(wall,iterations=2)
lbl,n=ndimage.label(wall); sizes=ndimage.sum(np.ones_like(lbl),lbl,range(1,n+1))
net=lbl==(np.argmax(sizes)+1)
sil=ndimage.binary_erosion(ndimage.binary_fill_holes(net|drawn),iterations=2)

# soft walls via brightness elevation (respects faint boundaries); silhouette+river seal
barrier=(~sil)|drawn
free=~barrier
dist=ndimage.distance_transform_edt(free)
elev=ndimage.gaussian_filter(bright,0.6)
cc,_=ndimage.label(free)

seeds={'dobong':(395,56),'nowon':(445,75),'gangbuk':(381,97),'eunpyeong':(282,116),
 'seongbuk':(384,140),'jungrang':(467,138),'seodaemun':(289,165),'jongno':(339,164),
 'dongdaemun':(422,167),'junggoo':(357,187),'seongdong':(412,200),'gwangjin':(462,203),
 'gangdong':(532,194),'gangseo':(155,182),'mapo':(262,192),'yongsan':(342,222),
 'yangcheon':(194,245),'yeongdeungpo':(252,252),'dongjak':(304,266),'songpa':(494,253),
 'guro':(182,275),'seocho':(375,287),'gangnam':(437,281),'gwanak':(300,320),'geumcheon':(235,320)}
ids=list(seeds.keys())

def nearest_free(px,py):
    if 0<=py<H and 0<=px<W and free[py,px]: return px,py
    for r in range(1,40):
        for dy in range(-r,r+1):
            for dx in range(-r,r+1):
                yy,xx=py+dy,px+dx
                if 0<=yy<H and 0<=xx<W and free[yy,xx]: return xx,yy
    return px,py
# Wall mask = the boundary-line network. Most borders join into one big connected
# component, but some (e.g. the Geumcheon|Gwanak border) are separate strokes, so
# keep EVERY sufficiently-large bright component as wall. Label glyphs are small
# (< ~800 px here) and stay excluded, so text never distorts a district's shape —
# the "trace outlines from a text-free map" idea, done without editing the image.
_w=bright>300; _w[:m,:]=0;_w[-m:,:]=0;_w[:,:m]=0;_w[:,-m:]=0
_wl,_wn=ndimage.label(ndimage.binary_dilation(_w,iterations=1))
_wsz=ndimage.sum(np.ones_like(_wl),_wl,range(_wn+1)); _wsz[0]=0
# tell borders from label text by bbox shape: a label row is a short, FLAT blob
# (height ≤ ~18 px once glyphs merge), while border strokes wander in both axes.
# So: wall = big component that is NOT a flat text row. This keeps the
# Geumcheon|Gwanak stroke while a district name printed across a narrow strip
# stays passable for its own district's flood.
_objs=ndimage.find_objects(_wl)
_wallids=set()
for _i,_sl in enumerate(_objs,1):
    if _sl is None: continue
    if _wsz[_i]<800: continue
    _bw=_sl[1].stop-_sl[1].start; _bh=_sl[0].stop-_sl[0].start
    _is_text_row = (_bh<=28 and _bw<=320) or (_bw<=28 and _bh<=320)
    if not _is_text_row: _wallids.add(_i)
wallmask=np.isin(_wl,list(_wallids))
interior = free & ~wallmask
_icc,_inn=ndimage.label(interior)
_isz=ndimage.sum(np.ones_like(_icc),_icc,range(_inn+1)).astype(int)
bigint = interior & (_isz[_icc]>=1500)
def place(px,py):
    # nearest pixel that sits in a large interior region (avoids label-text/road traps)
    for r in range(0,60):
        for dy in range(-r,r+1):
            for dx in range(-r,r+1):
                if max(abs(dx),abs(dy))!=r and r>0: continue
                yy,xx=py+dy,px+dx
                if 0<=yy<H and 0<=xx<W and bigint[yy,xx]:
                    return xx,yy
    return nearest_free(px,py)

# Dijkstra: edge weight 1 in flat interiors (=> Voronoi split), huge across strong walls
weight = 1.0 + wallmask.astype(float)*500.0
INF=1e18
cost=np.full((H,W),INF); lab=np.zeros((H,W),np.int32); lab[barrier]=-1
heap=[]; _seq=[0]
for i,k in enumerate(ids,1):
    x,y=place(*P(*seeds[k]))
    if lab[y,x]!=-1:
        cost[y,x]=0.0; lab[y,x]=i; _seq[0]+=1
        heapq.heappush(heap,(0.0,_seq[0],x,y,i))
while heap:
    c,_,x,y,l=heapq.heappop(heap)
    if c>cost[y,x]: continue
    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
        nx,ny=x+dx,y+dy
        if 0<=nx<W and 0<=ny<H and lab[ny,nx]!=-1:
            nc=c+weight[ny,nx]
            if nc<cost[ny,nx]:
                cost[ny,nx]=nc; lab[ny,nx]=l; _seq[0]+=1
                heapq.heappush(heap,(nc,_seq[0],nx,ny,l))
sz={k:int((lab==i+1).sum()) for i,k in enumerate(ids)}
for k in ids: print(f'{k:14s} {sz[k]:7d}{"  BIG" if sz[k]>48000 else ("  tiny" if sz[k]<2000 else "")}')
np.save('tools/minimap-trace/_out/lab.npy',lab)
# hard mask = genuinely un-fillable pixels: outside the city silhouette or river
# water (manual seal strokes are NOT hard — they may be absorbed by districts)
_rim2=Image.new('L',(W,H),0)
ImageDraw.Draw(_rim2).line([P(*p) for p in river],fill=255,width=RIVER_W,joint='curve')
np.save('tools/minimap-trace/_out/hard.npy', (~sil)|waterband)
np.save('tools/minimap-trace/_out/water.npy', waterband)
# manual seal strokes only (fillable barriers, unlike water)
_rim3=Image.new('L',(W,H),0)
for poly in MANUAL: ImageDraw.Draw(_rim3).line([P(*p) for p in poly],fill=255,width=6,joint='curve')
np.save('tools/minimap-trace/_out/strokes.npy', np.asarray(_rim3)>0)
json.dump({'ids':ids,'DS':DS,'W':W,'H':H,'FW':FW,'FH':FH},open('tools/minimap-trace/_out/meta.json','w'))
rng=np.random.RandomState(3); colors=rng.randint(60,255,(len(ids)+1,3))
vis=(a*0.5).astype(np.uint8)
for i in range(1,len(ids)+1):
    mm=lab==i; vis[mm]=(vis[mm]*0.3+colors[i]*0.7).astype(np.uint8)
Image.fromarray(vis).resize((820,458)).save('tools/minimap-trace/_out/seg.png')
print('done')
