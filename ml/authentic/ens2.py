import pandas as pd,numpy as np,json,glob,os,gc,pickle
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from scipy.sparse import diags
import feats
from feats import segments
rng=np.random.default_rng(11)
S=pd.read_pickle('segs.pkl')
rows=[]
for f in sorted(glob.glob('gen_*.jsonl')):
    for k,l in enumerate(open(f)):
        if not l.strip(): continue
        g=json.loads(l); sp=rng.choice(['train','cal','test'],p=[.7,.15,.15]); did=f'{f}:{k}'
        rows+=[(x,1,'modern','haiku:'+g.get('style',''),sp,did) for x in segments(g['text'])]
S=pd.concat([S,pd.DataFrame(rows,columns=S.columns)],ignore_index=True)
M=[json.loads(l) for l in open('modern_ai.jsonl') if l.strip()]
Mseg=[(i,x) for i,g in enumerate(M) for x in segments(g['text'])]
def charf(t):
    t=feats.norm(t).lower(); out=[]
    for w in feats.TOK.findall(t):
        if not w[0].isalpha(): continue
        w=' '+w+' '
        for n in (3,4,5):
            for i in range(len(w)-n+1): out.append('c:'+w[i:i+n])
    return out
def X(texts,an,nf):
    A=HashingVectorizer(analyzer=an,n_features=nf,alternate_sign=False,norm=None).transform(texts).astype(np.float32); A.data=np.log1p(A.data)
    n=np.sqrt(A.multiply(A).sum(1)).A1; n[n==0]=1; return (diags(1/n)@A).tocsr()
texts=list(S.text)+[x for _,x in Mseg]; n=len(S)
tr=(S.split=='train').values; GW=float(os.environ.get('GW','12')); sw=np.where(S.domain=='modern',GW,1.0)
XA=X(texts,feats.features,2**18)
A=LogisticRegression(C=8,max_iter=3000,class_weight='balanced',solver='liblinear').fit(XA[:n][tr],S.label[tr],sample_weight=sw[tr])
pA=A.predict_proba(XA)[:,1]; del XA; gc.collect()
keep=tr&((S.domain.isin(['essay','modern']))|(np.random.default_rng(0).random(n)<0.5)).values
XB=X(texts,charf,2**19)
B=SGDClassifier(loss='log_loss',alpha=2e-6,max_iter=40,tol=1e-4,class_weight='balanced',random_state=0).fit(XB[:n][keep],S.label[keep],sample_weight=sw[keep])
pB=B.predict_proba(XB)[:,1]; del XB; gc.collect()
pickle.dump({'A':(A.coef_[0].astype(np.float32),float(A.intercept_[0])),'B':(B.coef_[0].astype(np.float32),float(B.intercept_[0]))},open('ens2.pkl','wb'))
S['pA']=pA[:n]; S['pB']=pB[:n]; S['w']=S.text.str.split().str.len()
S[S.split!='train'].to_pickle('scored_ens2.pkl')
dm=pd.DataFrame(Mseg,columns=['i','t']); dm['w']=dm.t.str.split().str.len(); dm['pA']=pA[n:]; dm['pB']=pB[n:]; dm.to_pickle('modern_scored2.pkl')
for wa in (1.0,0.7,0.5):
    S['p']=wa*S.pA+(1-wa)*S.pB; dm['p']=wa*dm.pA+(1-wa)*dm.pB
    def doc(sp,dom):
        d=S[(S.split==sp)&(S.domain==dom)]
        g=d.groupby('doc').apply(lambda x: pd.Series({'l':x.label.iloc[0],'p':np.average(x.p,weights=x.w)}),include_groups=False)
        return ((g.p>.5)==g.l).mean(), (g[g.l==0].p>.5).mean() if (g.l==0).any() else 0, len(g)
    ea,ef,_=doc('test','essay'); ma,_,mn=doc('test','modern'); oa,_,_=doc('ood','essay')
    md=dm.groupby('i').apply(lambda x: np.average(x.p,weights=x.w),include_groups=False)
    print(f'GW={GW} wA={wa} | essay acc {ea:.3f} fpr {ef:.3f} | ood {oa:.3f} | modern-test(gen) {ma:.3f} n={mn} | modern40 {int((md>.5).sum())}/40',flush=True)
