import pandas as pd,numpy as np,json
rng=np.random.default_rng(1)
S=pd.read_pickle('scored.pkl'); S['w']=S.text.str.split().str.len()
DOMS=['essay','reddit','wikihow','wikipedia','arxiv','peerread']
import os
PD=[1,0,0,0,0,0] if os.environ.get('ESSAY')=='1' else [.5,.1,.1,.1,.1,.1]
def bucket(n): return 0 if n==1 else 1 if n<=3 else 2 if n<=6 else 3
def mix(sp,N):
    d=S[S.split==sp]; out=[]
    pools={(dm,l):g for (dm,l),g in d.groupby(['domain','label'])}
    for _ in range(N):
        dm=rng.choice(DOMS,p=PD); n=int(rng.integers(1,11))
        r=rng.random(); f= 0.0 if r<.3 else 1.0 if r<.5 else rng.random()
        k=int(round(f*n)); h=pools[(dm,0)].sample(n-k,random_state=int(rng.integers(1e9))); a=pools[(dm,1)].sample(k,random_state=int(rng.integers(1e9)))
        x=pd.concat([h,a]); w=x.w.values; true=(w*x.label.values).sum()/w.sum()
        soft=(w*x.p.values).sum()/w.sum(); hard=(w*(x.p.values>.5)).sum()/w.sum()
        out.append((bucket(n),true,soft,hard,dm))
    return pd.DataFrame(out,columns=['b','true','soft','hard','dom'])
cal=mix('cal',20000); te=mix('test',20000)
ALPHA=0.02; res={}
for kind in ('soft','hard'):
    q={}
    for b,g in cal.groupby('b'):
        r=np.abs(g['true']-g[kind]).values; n=len(r)
        q[int(b)]=float(np.quantile(r,min(1,np.ceil((n+1)*(1-ALPHA))/n),method='higher'))
    te['lo']=np.clip(te[kind]-te.b.map(q),0,1); te['hi']=np.clip(te[kind]+te.b.map(q),0,1)
    cov=((te.true>=te.lo)&(te.true<=te.hi)).mean()
    print(kind,'q',{k:round(v,3) for k,v in q.items()},'test coverage %.4f'%cov,'mean width %.3f'%(te.hi-te.lo).mean())
    print('  by domain coverage', te.assign(c=(te.true>=te.lo)&(te.true<=te.hi)).groupby('dom').c.mean().round(3).to_dict())
    hum=te[te.true==0]; print('  pure-human docs: flagged lo>0.5 rate %.4f'%(hum.lo>0.5).mean(), ' lo>0.15 %.4f'%(hum.lo>0.15).mean())
    ai=te[te.true==1]; print('  pure-AI docs: lo>0.5 rate %.3f'%(ai.lo>0.5).mean())
    res[kind]=q
json.dump(res,open('conformal.json','w'))
