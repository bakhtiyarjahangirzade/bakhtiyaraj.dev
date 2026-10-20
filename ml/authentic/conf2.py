import pandas as pd,numpy as np,json
from sklearn.isotonic import IsotonicRegression
S=pd.read_pickle('scored_ens2.pkl'); S=S[S.domain.isin(['essay','modern'])].copy()
S['p']=0.7*S.pA+0.3*S.pB
# split cal docs into cal1 (isotonic) and cal2 (conformal)
docs=S[S.split=='cal'].doc.astype(str).unique(); r=np.random.default_rng(3); c1=set(r.choice(docs,len(docs)//2,replace=False))
S.loc[(S.split=='cal')&(S.doc.astype(str).isin(c1)),'split']='cal1'
iso=IsotonicRegression(out_of_bounds='clip',y_min=0,y_max=1).fit(S[S.split=='cal1'].p,S[S.split=='cal1'].label)
S['pi']=iso.predict(S.p)
bucket=lambda n: 0 if n==1 else 1 if n<=3 else 2 if n<=6 else 3
def mix(sp,N):
    d=S[S.split==sp]; H=d[d.label==0]; A=d[d.label==1]; rr=np.random.default_rng(7); out=[]
    for _ in range(N):
        n=int(rr.integers(1,11)); u=rr.random(); f=0.0 if u<.3 else 1.0 if u<.5 else rr.random(); k=int(round(f*n))
        x=pd.concat([H.sample(n-k,random_state=int(rr.integers(1e9))),A.sample(k,random_state=int(rr.integers(1e9)))])
        w=x.w.values/x.w.values.sum()
        out.append(dict(b=bucket(n),n=n,true=(w*x.label.values).sum(),soft=(w*x.p.values).sum(),iso=(w*x.pi.values).sum(),
                        u=(w*x.pi.values*(1-x.pi.values)).sum(), u2=np.sqrt((w**2*x.pi.values*(1-x.pi.values)).sum())))
    return pd.DataFrame(out)
cal=mix('cal',15000); te=mix('test',15000)
def run(name,pred,scale):
    q={}
    for b,g in cal.groupby('b'):
        rr=(np.abs(g.true-g[pred])/scale(g)).values; nn=len(rr); q[int(b)]=float(np.quantile(rr,min(1,np.ceil((nn+1)*.98)/nn),method='higher'))
    s=scale(te); half=te.b.map(q)*s
    lo=np.clip(te[pred]-half,0,1); hi=np.clip(te[pred]+half,0,1); cov=((te.true>=lo)&(te.true<=hi)).mean()
    w=hi-lo
    print(f'{name:28s} cov {cov:.4f} width mean {w.mean():.3f} median {w.median():.3f} | pure human {w[te.true==0].mean():.3f} pure AI {w[te.true==1].mean():.3f} mixed {w[(te.true>0)&(te.true<1)].mean():.3f} | human lo>.5 {(lo[te.true==0]>.5).mean():.4f}')
    return q
run('fixed soft',"soft",lambda g: 1)
run('fixed iso',"iso",lambda g: 1)
for e in (0.02,0.05,0.1):
    run(f'adaptive iso sqrt(u)+{e}',"iso",lambda g,e=e: np.sqrt(g.u)+e)
    run(f'adaptive iso u2+{e}',"iso",lambda g,e=e: g.u2+e)
import pickle; pickle.dump(iso,open('iso.pkl','wb'))
q=run('FINAL adaptive iso sqrt(u)+0.05',"iso",lambda g: np.sqrt(g.u)+0.05)
xt,yt=iso.X_thresholds_,iso.y_thresholds_
idx=np.unique(np.linspace(0,len(xt)-1,min(len(xt),240)).round().astype(int))
json.dump({'q':q,'eps':0.05,'iso':[[round(float(xt[i]),5),round(float(yt[i]),5)] for i in idx]},open('conformal_v3.json','w'))
# check that downsampled isotonic matches
xi=np.array([a for a,b in json.load(open('conformal_v3.json'))['iso']]); yi=np.array([b for a,b in json.load(open('conformal_v3.json'))['iso']])
pp=np.random.default_rng(0).random(20000); print('iso approx max err', np.abs(np.interp(pp,xi,yi)-iso.predict(pp)).max())
