import pandas as pd,numpy as np,json,glob,os,gc,pickle
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from scipy.sparse import diags
import feats
from feats import segments
S=pd.read_pickle('segs.pkl')
G=[json.loads(l) for f in sorted(glob.glob('gen_*.jsonl')) for l in open(f) if l.strip()]
S=pd.concat([S,pd.DataFrame([(x,1,'modern','h','train',-1) for g in G for x in segments(g['text'])],columns=S.columns)],ignore_index=True)
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
tr=(S.split=='train').values; sw=np.where(S.domain=='modern',16,1.0)
# model A: base features, LR
XA=X(texts,feats.features,2**18)
A=LogisticRegression(C=8,max_iter=3000,class_weight='balanced',solver='liblinear').fit(XA[:n][tr],S.label[tr],sample_weight=sw[tr])
pA=A.predict_proba(XA)[:,1]; del XA; gc.collect()
# model B: char n-grams only, SGD on subsample of non-essay train
rng=np.random.default_rng(0); keep=tr&((S.domain.isin(['essay','modern']))|(rng.random(n)<0.5)).values
XB=X(texts,charf,2**19)
B=SGDClassifier(loss='log_loss',alpha=2e-6,max_iter=30,tol=1e-4,class_weight='balanced',random_state=0).fit(XB[:n][keep],S.label[keep],sample_weight=sw[keep])
pB=B.predict_proba(XB)[:,1]; del XB; gc.collect()
pickle.dump({'A':(A.coef_[0].astype(np.float32),float(A.intercept_[0])),'B':(B.coef_[0].astype(np.float32),float(B.intercept_[0]))},open('ens.pkl','wb'))
S['w']=S.text.str.split().str.len(); dm=pd.DataFrame(Mseg,columns=['i','t']); dm['w']=dm.t.str.split().str.len()
for wa in (1.0,0.7,0.5,0.0):
    S['p']=wa*pA[:n]+(1-wa)*pB[:n]; dm['p']=wa*pA[n:]+(1-wa)*pB[n:]
    def doc(sp,dom=None):
        d=S[(S.split==sp)&((S.domain==dom) if dom else True)]
        g=d.groupby('doc').apply(lambda x: pd.Series({'l':x.label.iloc[0],'p':np.average(x.p,weights=x.w)}),include_groups=False)
        return ((g.p>.5)==g.l).mean(), (g[g.l==0].p>.5).mean() if (g.l==0).any() else 0
    ea,ef=doc('test','essay'); oa,_=doc('ood'); aa,af=doc('test')
    md=dm.groupby('i').apply(lambda x: np.average(x.p,weights=x.w),include_groups=False)
    print(f'wA={wa} | essay acc {ea:.3f} fpr {ef:.3f} | all acc {aa:.3f} fpr {af:.3f} | ood {oa:.3f} | modern {int((md>.5).sum())}/40',flush=True)
S['pA']=pA[:n]; S['pB']=pB[:n]; S[S.split!='train'].drop(columns=['p']).to_pickle('scored_ens.pkl')
