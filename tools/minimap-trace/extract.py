import numpy as np
from scipy import ndimage
import json
from PIL import Image

lab=np.load('tools/minimap-trace/_out/lab.npy')
meta=json.load(open('tools/minimap-trace/_out/meta.json'))
ids=meta['ids']; H,W=lab.shape
# === CELL SNAPPING =========================================================
# The Dijkstra flood is only approximate BETWEEN drawn lines. Snap it to the
# artwork: label whole CELLS (regions enclosed by the drawn line network) by
# majority vote of the flood. District boundaries then follow the drawn lines
# EXACTLY, and no-man's cells (Han river water, off-map pockets, margins) can be
# excluded wholesale.
_full=Image.open('assets/images/ui/minimap-map/seoul-blueprint-map-final00-clean.png').convert('RGB').resize((W,H))
_b=np.asarray(_full).astype(float).sum(2)
_w=_b>300; _w[:38,:]=0;_w[-38:,:]=0;_w[:,:38]=0;_w[:,-38:]=0
_wl,_wn=ndimage.label(ndimage.binary_dilation(_w,iterations=1))
_wsz=ndimage.sum(np.ones_like(_wl),_wl,range(_wn+1)); _wsz[0]=0
# cell walls = EVERY sufficiently large bright component that is not a printed
# label row (same rule as segment.py's wallmask) — not just the single largest
# network. Detached borders (NW-arm banks, isolated strokes) then bound cells
# too, so district edges follow them instead of needing hand-drawn cuts.
_objs=ndimage.find_objects(_wl)
_wallids=[]
for _i,_sl in enumerate(_objs,1):
    if _sl is None or _wsz[_i]<800: continue
    _bw=_sl[1].stop-_sl[1].start; _bh=_sl[0].stop-_sl[0].start
    if (_bh<=28 and _bw<=320) or (_bw<=28 and _bh<=320): continue  # label text row
    _wallids.append(_i)
_net=np.isin(_wl,_wallids)
# seal small gaps so corridors along annotation lines / dashed borders become
# enclosed cells instead of merging with neighbours or the margin
_netc=ndimage.binary_closing(_net,structure=ndimage.generate_binary_structure(2,2),iterations=3)
# manual seal strokes also act as cell walls: they split cells exactly along the
# borders the artwork draws dashed/gappy (Geumcheon|Gwanak, NW-arm exit, ...)
_strokes=np.load('tools/minimap-trace/_out/strokes.npy')
_netc=_netc|_strokes
_cells,_ncell=ndimage.label(~_netc)

# vote histogram per cell (barrier/-1 and unassigned don't vote)
NLAB=len(ids)+1
_labv=np.clip(lab,0,NLAB-1)
_comb=_cells.astype(np.int64)*NLAB+_labv
_cnt=np.bincount(_comb.ravel(),minlength=(_ncell+1)*NLAB).reshape(_ncell+1,NLAB)
_cnt[:,0]=0
_tot=_cnt.sum(1); _mx=_cnt.max(1); _arg=_cnt.argmax(1)

# snap a cell wholesale ONLY when one district clearly owns it (≥90 % of votes):
# there the drawn lines bound the district exactly. Mixed cells (dashed/gappy
# borders inside) keep the flood's split.  0 = keep flood.
_snap=np.zeros(_ncell+1,np.int32)
_ok=(_tot>0)&(_mx>=0.9*_tot)
_snap[_ok]=_arg[_ok]

# margin cells (touch the image border) must never snap to a district
_border=set(_cells[0,:])|set(_cells[-1,:])|set(_cells[:,0])|set(_cells[:,-1]); _border.discard(0)
_FORCE0=set()
for _c in _border: _snap[_c]=0; _FORCE0.add(_c)
# known annotation-pocket cells east of Gangdong (between the real border and
# the dimension lines): force unassigned. River water needs no cell forcing —
# segment.py paints the whole water band as flood barrier (-1) and that is
# stripped back out of the snap result below.
_POCKETS=[(1165,350),(1180,430),(1148,312)]
_HARD0=set()
for x,y in _POCKETS:
    _c=_cells[y,x]
    if _c: _snap[_c]=0; _FORCE0.add(_c); _HARD0.add(_c)
_snap[0]=0

# WATER CELL SNAP: the painted water band is hand-traced and wiggles off the
# drawn bank lines. Any cell the band substantially covers is river channel —
# waterize it WHOLESALE so riverside district edges land exactly on the banks.
_wb=np.load('tools/minimap-trace/_out/water.npy')
_wcov=np.bincount(_cells.ravel(),weights=_wb.ravel(),minlength=_ncell+1)
_csz=np.bincount(_cells.ravel(),minlength=_ncell+1); _csz[_csz==0]=1
_wfrac=_wcov/_csz
_iswater=_wfrac>=0.45; _iswater[0]=False
for _c in _border: _iswater[_c]=False          # margins are handled by ~sil
_wcell=_iswater[_cells]
for _c in np.where(_iswater)[0]: _snap[_c]=0; _FORCE0.add(int(_c))
# Gangseo's hatched pentagon lobe (SE of the bump, NE of Yangcheon's label):
# bounded by its own bright outline but the Yangcheon seed floods it first —
# hard-assign its cell to Gangseo (the hatch pattern marks it as Gangseo's).
_gsc=_cells[440,380]
if _gsc and _gsc not in _border:
    _snap[_gsc]=ids.index('gangseo')+1
    _FORCE0.discard(_gsc)

_snapped=_snap[_cells]
_forced=np.isin(_cells,list(_FORCE0)) if _FORCE0 else np.zeros_like(_cells,bool)
# RECLAIM: the opposite failure of the water-cell snap — where the painted band
# overshoots INTO a cell that clearly belongs to a district (≥90 % snap), those
# pixels are land wrongly marked water (e.g. the confluence stroke clipping
# Yongsan's riverfront). Give them back. East annotation zone excluded: the
# channel there merges with the empty grid cell and must stay water.
_Yr,_Xr=np.mgrid[0:H,0:W]
# reclaim applies to snapped-district cells AND to wall/hatch pixels (netc has
# no cell id, but a band overshoot onto e.g. Gangseo's hatched fill is still
# land — without this the final fill can't cross it and the area goes unowned)
# ... and only near the band's edge (≤8px from land): a leaky cell can mix a
# district with genuine channel water (e.g. Yongsan + the confluence pocket) —
# deep water must never be resurrected even if its cell snapped to a district.
_reclaim=(_wb&(~_wcell)&(_Xr<1100)
          &((_snapped>0)|(_netc&(~ndimage.binary_dilation(_wcell,iterations=3))))
          &ndimage.binary_dilation(~_wb,iterations=8))
lab=np.where(_snapped>0, _snapped, np.where(_forced, 0, np.clip(lab,0,None)))
# line-network pixels start unassigned (they may carry stray flood labels from
# annotation lines), then grow adjacent districts a few px in so neighbours meet
# mid-line.
lab=np.where(_netc, 0, lab)
for _ in range(5):
    _grown=ndimage.grey_dilation(lab,size=(3,3))
    lab=np.where((lab==0)&_netc, _grown, lab)
# fill unassigned in-city gaps (hatch-stripe stripes, label rows, line residue)
# by growing the surrounding districts in — but never into water/off-map
# (flood barrier -1) or force-cleared cells (margin, pockets).
_lab0=np.load('tools/minimap-trace/_out/lab.npy')
_protected=((_lab0==-1)&(~_reclaim))|_forced
for _ in range(40):
    _grown=ndimage.grey_dilation(lab,size=(3,3))
    _fill=(lab==0)&(~_protected)&(_grown>0)
    if not _fill.any(): break
    lab=np.where(_fill,_grown,lab)
# water / off-map ground truth: the flood's own barrier (-1 = outside silhouette,
# river stroke, manual seals) plus whole water cells. Cell snapping may have
# painted districts across river water inside a leaky cell — strip it back out.
lab=np.where(((_lab0==-1)&(~_reclaim))|_wcell, 0, lab)
np.save('tools/minimap-trace/_out/water_final.npy',(_wb&(~_reclaim))|_wcell)
# margin-connected cells keep the FLOOD's labels (the flood is already bounded by
# the silhouette, so anything it assigned inside such a cell is real city that a
# coastline/label gap merely joined to the margin). Bare margin stays 0 because
# the flood never assigned it (-1/0). The east annotation zone (x>1140) is
# excluded: the flood historically leaks along dimension lines there.
_Y,_X=np.mgrid[0:H,0:W]
_hard=np.isin(_cells,list(_HARD0)) if _HARD0 else np.zeros_like(_cells,bool)
# restore disabled: with the full wallmask + manual seals, every district's cells
# are enclosed, so flood labels inside margin-connected cells are pure leakage —
# restoring them made hand cuts (not drawn lines) define those boundaries.
_restore=np.zeros_like(_forced)
lab=np.where(_restore, np.clip(np.load('tools/minimap-trace/_out/lab.npy'),0,None), lab)
# FINAL fill — but ONLY into line-network pixels (hatch bands classed as walls)
# and manual seal strokes. Restricting the target set keeps the fill from
# marching across open ground (e.g. river water just outside the water band).
_hardm=np.load('tools/minimap-trace/_out/hard.npy')
_strokes=np.load('tools/minimap-trace/_out/strokes.npy')
# keep the fill off water cells AND their bank lines' inner half, so bridges and
# bank strokes never grow district tentacles over the channel. Reclaimed pixels
# (band overshoot onto land/hatch) are fillable again.
_fillable=(_netc|_strokes)&(~(_hardm&(~_reclaim)))&(~ndimage.binary_dilation(_wcell,iterations=2))
for _ in range(40):
    _grown=ndimage.grey_dilation(lab,size=(3,3))
    _fill=(lab==0)&_fillable&(_grown>0)
    if not _fill.any(): break
    lab=np.where(_fill,_grown,lab)
# ===========================================================================
# EAST hard cut: the real Gangdong/Songpa east border is drawn DOTTED, so the
# flood/snap can leak into the empty grid zone between it and the dimension
# lines. Clip along the border read from the artwork (y -> max x, work coords).
_ey=[280, 300, 330, 350, 370, 390, 405, 418, 425, 432, 460, 490, 510, 535, 555, 580, 600, 615, 625, 640, 700]
_ex=[1125,1125,1132,1142,1150,1152,1152,1150,1140,1115,1090,1092,1080,1088,1090,1072,1055,1030,1010,1000, 995]
_ecut=np.interp(np.arange(H), _ey, _ex)
_YY,_XX=np.mgrid[0:H,0:W]
lab=np.where((_YY>=280)&(_XX>_ecut[_YY]), 0, lab)
# remove empty off-map area north/NW of the city (grid-only, no districts there).
# Clip along Eunpyeong's ACTUAL top boundary (a polyline) so its hit-zone hugs the
# real border instead of ballooning into the empty wedge above Gangbuk.
Y,X=np.mgrid[0:H,0:W]
_tx=[40, 290, 500, 530, 560, 600, 630, 660, 680, 695, 705, 720, 735, 745, 770]
_ty=[168, 165, 163, 145, 138, 120, 132, 112,  96,  92, 130, 105,  84,  60,  48]
_cut=np.interp(np.arange(W), _tx, _ty)      # top-boundary y per column
lab=np.where((X<772)&(Y<_cut[X]), 0, lab)   # NW empty area above Eunpyeong
lab=np.where(Y<47, 0, lab)                  # thin top border strip
lab=np.where(X<180, 0, lab)                 # west margin + dimension-line strip
                                            # (westmost city = Gangseo at x~192)
# Eunpyeong-specific clips (flood leaks into the NW off-map zone through border
# gaps and the margin-cell restore brings it back; the Bukhansan wedge between
# Eunpyeong's NE border and Gangbuk's west border is empty mountain, no district).
# West border curve, read off the artwork (y -> min x):
_EUN=ids.index('eunpyeong')+1
_wy=[150,160,185,200,215,235,255,270,285,295,303,310,320,330,340,352]
_wx=[520,520,522,519,514,509,502,498,497,500,485,470,483,497,510,524]
_wcut=np.interp(np.arange(H), _wy, _wx)
# auto-snap to the drawn west border (leftmost line pixel within ±12px)
for _yy in range(150,353):
    _x0=int(_wcut[_yy])
    for _xx in range(max(0,_x0-12),_x0+13):
        if _net[_yy,_xx]: _wcut[_yy]=_xx+2; break
lab=np.where((lab==_EUN)&(X<_wcut[Y]), 0, lab)
# NE border polyline (x -> min y): the hook at (513,166), the bulge peaking at
# (600,132), then descending SE to the Eunpyeong|Gangbuk|Jongno junction (676,205)
_nx=[513,525,543,552,560,572,578,583,590,600,607,612,620,628,634,640,645,652,658,665,670,676]
_ny=[166,171,174,167,161,157,148,141,137,132,134,140,144,149,156,160,167,173,183,190,197,205]
_ncut=np.interp(np.arange(W), _nx, _ny)
# auto-snap the cut to the ACTUAL drawn border: the hand polyline is only a
# corridor hint — per column, use the topmost line pixel within ±12px of it
for _x in range(513,677):
    _y0=int(_ncut[_x])
    for _yy in range(max(0,_y0-12),_y0+13):
        if _net[_yy,_x]: _ncut[_x]=_yy+2; break
lab=np.where((lab==_EUN)&(X>=513)&(X<=676)&(Y<_ncut[X]), 0, lab)
lab=np.where((lab==_EUN)&(X>676)&(Y<210), 0, lab)  # beyond the junction
# Yeouido → Yeongdeungpo: the island is separated only by the narrow 샛강, which
# is deliberately NOT painted as water so the island stays clickable. The flood
# can reach it from Dongjak along the south bank first — hard-assign the island
# + 샛강 strip (one ~hard component, clipped to the island bbox) to Yeongdeungpo.
_YEO=ids.index('yeongdeungpo')+1
_isl=(X>=510)&(X<=602)&(Y>=443)&(Y<=502)&(~_hardm)
_il,_=ndimage.label(_isl)
if _il[470,545]: lab=np.where(_il==_il[470,545], _YEO, lab)
# Yeongdeungpo|Dongjak at the saetgang mouth: the border IS drawn (bridge foot
# → elbow) but Yeongdeungpo's seed sits ~50px away, so its flood crosses the
# wall anyway. Hand anything east of the line to Dongjak.
_YDP=ids.index('yeongdeungpo')+1; _DJK=ids.index('dongjak')+1
_sy=[495,504,510,516,528]
_sx=[557,552,548,545,543]
_scut=np.interp(np.arange(H),_sy,_sx)
lab=np.where((Y>=495)&(Y<=528)&(X>_scut[Y])&(lab==_YDP), _DJK, lab)
# Gangseo's hatched coastal strip: Eunpyeong's flood invades it along the arm
# channel corridor (hatch walls make Gangseo's own flood expensive) and then
# dies to the Eunpyeong cuts, leaving the strip unowned. Grow ONLY Gangseo into
# the strip, walled by its coast line (hand polyline, auto-snapped to the drawn
# line like the Eunpyeong cuts).
_GS=ids.index('gangseo')+1
_ccx=[235,270,300,330,360,390,420,445,470]
_ccy=[288,297,307,317,327,337,348,355,362]
_coast=np.interp(np.arange(W),_ccx,_ccy)
for _x in range(235,471):
    _y0=int(_coast[_x])
    for _yy in range(max(0,_y0-10),_y0+11):
        if _net[_yy,_x]: _coast[_x]=_yy+2; break
# NOTE: no ~_forced here — the strip is border-connected (coast gap merges it
# into the margin ring cell); the bbox + coast wall keep the growth contained
_room=(X>=235)&(X<=430)&(Y>_coast[X])&(Y<=366)&(~_wcell)
_gsm=lab==_GS
for _ in range(200):
    _new=(ndimage.binary_dilation(_gsm,iterations=1)&_room&(lab==0))|_gsm
    if (_new==_gsm).all(): break
    _gsm=_new
lab=np.where(_gsm&(lab==0),_GS,lab)
# Gangseo's bump (궁산 hill + hatched patch, north of the Gangseo|Yangcheon
# seal): its cell leaks into Yangcheon's body through outline gaps, so the
# whole merged cell votes Yangcheon. Clear Yangcheon north of the seal line
# and let Gangseo grow in (growth can't cross the seal — south of it stays
# labelled Yangcheon).
_YC=ids.index('yangcheon')+1
_bcut=np.interp(np.arange(W),[292,306,326,346],[442,456,454,458])
_bz=(X>=294)&(X<=346)&(Y>=398)&(Y<_bcut[X])
lab=np.where(_bz&(lab==_YC),0,lab)
_gsm2=lab==_GS
for _ in range(120):
    _new=(ndimage.binary_dilation(_gsm2,iterations=1)&_bz&(lab==0))|_gsm2
    if (_new==_gsm2).all(): break
    _gsm2=_new
lab=np.where(_gsm2&(lab==0),_GS,lab)
# Geumcheon: the seal-stroke fill can leave a 2-3px whisker running down the
# dashed-border line past the district's real SE corner — shave that edge.
_GEUM=ids.index('geumcheon')+1
lab=np.where((lab==_GEUM)&(X>=548)&(Y>=672), 0, lab)
# keep the largest connected piece per district (plus any piece that reconnects
# to it across a thin gap, e.g. Geumcheon's tail across a seal stroke)
for i in range(1,len(ids)+1):
    mm=lab==i
    if mm.sum()==0: continue
    ll,nn=ndimage.label(mm)
    if nn>1:
        ss=ndimage.sum(np.ones_like(ll),ll,range(1,nn+1))
        big=ll==(np.argmax(ss)+1)
        near=ndimage.binary_dilation(big,iterations=6)
        keep=big.copy()
        for j in range(1,nn+1):
            if j==np.argmax(ss)+1: continue
            piece=ll==j
            if (piece&near).any(): keep|=piece
        lab=np.where(mm & ~keep, 0, lab)

def largest_cc(mask):
    l,n=ndimage.label(mask)
    if n==0: return mask
    sz=ndimage.sum(np.ones_like(l),l,range(1,n+1))
    return l==(np.argmax(sz)+1)

def trace(mask):
    # Moore boundary tracing on a filled binary mask; returns ordered (x,y) list
    ys,xs=np.where(mask)
    if len(xs)==0: return []
    # start: topmost-leftmost
    sy=ys.min(); sx=xs[ys==sy].min()
    # 8-neighborhood clockwise starting from left
    nb=[(-1,0),(-1,1),(0,1),(1,1),(1,0),(1,-1),(0,-1),(-1,-1)]
    def inside(x,y): return 0<=x<W and 0<=y<H and mask[y,x]
    contour=[(sx,sy)]
    cx,cy=sx,sy
    # initial backtrack dir = came from left
    bdir=6  # (0,-1)
    start=(sx,sy); count=0; maxit=len(xs)*8+1000
    while True:
        found=False
        for k in range(8):
            d=(bdir+1+k)%8
            dx,dy=nb[d]
            nx,ny=cx+dx,cy+dy
            if inside(nx,ny):
                # backtrack becomes opposite of movement dir
                bdir=(d+4)%8
                cx,cy=nx,ny
                contour.append((cx,cy)); found=True; break
        count+=1
        if not found: break
        if (cx,cy)==start and len(contour)>2: break
        if count>maxit: break
    return contour

def perp_dist(p,a,b):
    (x,y),(x1,y1),(x2,y2)=p,a,b
    dx,dy=x2-x1,y2-y1
    if dx==0 and dy==0: return ((x-x1)**2+(y-y1)**2)**.5
    t=((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy)
    px,py=x1+t*dx,y1+t*dy
    return ((x-px)**2+(y-py)**2)**.5

def dp(points,eps):
    if len(points)<3: return points
    dmax=0;idx=0
    for i in range(1,len(points)-1):
        d=perp_dist(points[i],points[0],points[-1])
        if d>dmax: dmax=d;idx=i
    if dmax>eps:
        l=dp(points[:idx+1],eps); r=dp(points[idx:],eps)
        return l[:-1]+r
    return [points[0],points[-1]]

out={}
import sys
sys.setrecursionlimit(100000)
for i,k in enumerate(ids,1):
    m=lab==i
    if m.sum()==0: 
        print('EMPTY',k); continue
    # connect near-pieces (e.g. a tail cut off by a 4-px seal stroke) by adding
    # ONLY the lens between the big piece and each nearby piece — no global bloat.
    _l,_n=ndimage.label(m)
    _s=ndimage.sum(np.ones_like(_l),_l,range(1,_n+1))
    _bigid=int(np.argmax(_s))+1
    _big=_l==_bigid
    _bigd=ndimage.binary_dilation(_big,iterations=4)
    _keep=_big.copy()
    for _j in range(1,_n+1):
        if _j==_bigid: continue
        _p=_l==_j
        if (_p&_bigd).any():
            _keep|=_p|(_bigd&ndimage.binary_dilation(_p,iterations=4))
    m=_keep
    m=ndimage.binary_fill_holes(m)
    # slight smoothing: close then open
    m0=ndimage.binary_closing(m,iterations=4)
    # opening kills thin spurs, but can also sever legitimate narrow parts (e.g.
    # Geumcheon's tail). Reconstruct: keep everything in the pre-opened mask that
    # is connected to the opened body.
    m=ndimage.binary_opening(m0,iterations=3)
    m=largest_cc(m)
    m=ndimage.binary_propagation(m, mask=m0)
    m=ndimage.binary_fill_holes(m)
    c=trace(m)
    if len(c)<4: print('SHORT',k,len(c)); continue
    simp=dp(c,eps=3.0)
    # ensure closed not duplicated
    if simp[0]==simp[-1]: simp=simp[:-1]
    out[k]=[[int(x),int(y)] for x,y in simp]
    print(f'{k:14s} pts={len(simp)}')

json.dump(out, open('tools/minimap-trace/_out/polys.json','w'))
print('W,H=',W,H)

# emit final JS district data (labels from clipped-mask centroid)
grid={'gangseo':'A6','yangcheon':'C8','guro':'C10','geumcheon':'D11','yeongdeungpo':'D7',
'mapo':'D5','seodaemun':'E4','eunpyeong':'D3','dobong':'H1','gangbuk':'G3','nowon':'J2',
'jongno':'G5','seongbuk':'I4','jungrang':'K5','junggoo':'G6','yongsan':'G7','dongdaemun':'I6',
'seongdong':'I7','gwangjin':'K7','gangdong':'M6','dongjak':'F8','gwanak':'F10','seocho':'H9',
'gangnam':'J9','songpa':'L9'}
order=['gangseo','yangcheon','guro','geumcheon','yeongdeungpo','mapo','seodaemun','eunpyeong',
'dobong','gangbuk','nowon','jongno','seongbuk','jungrang','junggoo','yongsan','dongdaemun',
'seongdong','gwangjin','gangdong','dongjak','gwanak','seocho','gangnam','songpa']
lines=[]
for k in order:
    i=ids.index(k)+1
    cy,cx=ndimage.center_of_mass(lab==i)
    pts=out[k]
    ptxt='['+','.join(f'[{x},{y}]' for x,y in pts)+']'
    pad=' '*(13-len(k)); gpad=' '*(4-len(grid[k]))
    lines.append(f"  {{ id: '{k}',{pad}grid: '{grid[k]}',{gpad} label: [{int(round(cx))},{int(round(cy))}], points: {ptxt} }},")
js="const DRAWN_MAP_DISTRICTS = [\n"+"\n".join(lines)+"\n];\n"
open('tools/minimap-trace/_out/districts.js.txt','w').write(js)
print('wrote districts.js.txt')
