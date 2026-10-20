import pandas as pd,numpy as np,json,glob,sys,os,time
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.linear_model import LogisticRegression
from scipy.sparse import diags, hstack
import feats
from feats import segments
S=pd.read_pickle('segs.pkl')
if os.environ.get('SUB'): S=S[(S.domain=='essay')|(S.split!='train')|(np.random.default_rng(0).random(len(S))<float(os.environ['SUB']))].reset_index(drop=True)
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
def mat(texts,an,nf):
    X=HashingVectorizer(analyzer=an,n_features=nf,alternate_sign=False,norm=None).transform(texts).astype(np.float32); X.data=np.log1p(X.data); return X
def l2(X):
    n=np.sqrt(X.multiply(X).sum(1)).A1; n[n==0]=1; return diags(1/n)@X
NF=int(os.environ.get('NF',2**18)); CH=os.environ.get('CH')=='1'
texts=list(S.text)+[x for _,x in Mseg]
t0=time.time()
X=mat(texts,feats.features,NF)
if CH: X=hstack([X,mat(texts,charf,NF)]).tocsr()
X=l2(X).tocsr(); print('feat time',round(time.time()-t0),'s',X.shape,flush=True)
n=len(S); XS,XM=X[:n],X[n:]
tr=(S.split=='train').values
for GW in [int(x) for x in os.environ.get('GWS','8,16').split(',')]:
  for C in [float(x) for x in os.environ.get('CS','4,8,16').split(',')]:
    sw=np.where(S.domain[tr]=='modern',GW,1.0)
    from sklearn.linear_model import SGDClassifier
    clf=(SGDClassifier(loss='log_loss',alpha=C,max_iter=30,tol=1e-4,class_weight='balanced',random_state=0) if os.environ.get('SGD') else LogisticRegression(C=C,max_iter=3000,class_weight='balanced',solver='liblinear')).fit(XS[tr],S.label[tr],sample_weight=sw)
    p=clf.predict_proba(XS)[:,1]; S['p']=p; S['w']=S.text.str.split().str.len()
    def doc(sp,dom=None):
        d=S[(S.split==sp)&((S.domain==dom) if dom else True)]
        g=d.groupby('doc').apply(lambda x: pd.Series({'l':x.label.iloc[0],'p':np.average(x.p,weights=x.w)}),include_groups=False)
        return ((g.p>.5)==g.l).mean(), (g[g.l==0].p>.5).mean() if (g.l==0).any() else 0
    ea,ef=doc('test','essay'); oa,_=doc('ood'); aa,af=doc('test')
    pm=clf.predict_proba(XM)[:,1]; dm=pd.DataFrame(Mseg,columns=['i','t']); dm['p']=pm; dm['w']=dm.t.str.split().str.len()
    md=dm.groupby('i').apply(lambda x: np.average(x.p,weights=x.w),include_groups=False)
    print(f'NF={NF} CH={CH} GW={GW} C={C} | essay acc {ea:.3f} fpr {ef:.3f} | all acc {aa:.3f} fpr {af:.3f} | ood {oa:.3f} | modern {int((md>.5).sum())}/40',flush=True)
