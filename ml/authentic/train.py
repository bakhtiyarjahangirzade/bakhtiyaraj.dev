import pandas as pd, numpy as np, pickle, sys
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, accuracy_score
from feats import features, segments
df=pd.read_pickle('data.pkl')
NF=2**18
hv=HashingVectorizer(analyzer=features,n_features=NF,alternate_sign=False,norm=None)
def X(texts):
    M=hv.transform(texts).astype(np.float32); M.data=np.log1p(M.data)
    n=np.sqrt(M.multiply(M).sum(1)).A1; n[n==0]=1
    from scipy.sparse import diags; return diags(1/n)@M
# segment-level training rows
seg=[]
for r in df.itertuples():
    for s in segments(r.text): seg.append((s,r.label,r.domain,r.group,r.split,r.Index))
S=pd.DataFrame(seg,columns=['text','label','domain','group','split','doc'])
S.to_pickle('segs.pkl')
print('segments',S.groupby('split').size().to_dict())
import json,glob
G=[json.loads(l) for f in sorted(glob.glob('gen_*.jsonl')) for l in open(f) if l.strip()]
gs=[(x,1,'modern','haiku:'+g['style'],'train',-1) for g in G for x in segments(g['text'])]
S=pd.concat([S,pd.DataFrame(gs,columns=S.columns)],ignore_index=True)
tr=S[S.split=='train']
W=float(__import__('os').environ.get('GW','8'))
sw=np.where(tr.domain=='modern',W,1.0)
Xtr=X(tr.text)
C=float(sys.argv[1]) if len(sys.argv)>1 else 4
clf=LogisticRegression(C=C,max_iter=2000,class_weight='balanced',solver='liblinear')
clf.fit(Xtr,tr.label,sample_weight=sw)
pickle.dump((clf.coef_[0].astype(np.float32),float(clf.intercept_[0])),open('model.pkl','wb'))
for sp in ('cal','test','ood'):
    d=S[S.split==sp]; p=clf.predict_proba(X(d.text))[:,1]; S.loc[d.index,'p']=p
    print(sp,'seg acc %.3f'%accuracy_score(d.label,p>.5), ('auc %.3f'%roc_auc_score(d.label,p)) if d.label.nunique()>1 else '')
S[S.split!='train'].to_pickle('scored.pkl')
t=S[S.split=='test']
for dom,g in t.groupby('domain'):
    print(dom,'acc %.3f'%accuracy_score(g.label,g.p>.5),'human FPR %.3f'%(g[g.label==0].p>.5).mean(),'AI recall %.3f'%(g[g.label==1].p>.5).mean())
# doc-level
for sp in ('test','ood'):
    d=S[S.split==sp].copy(); d['w']=d.text.str.split().str.len()
    g=d.groupby('doc').apply(lambda x: pd.Series({'label':x.label.iloc[0],'p':np.average(x.p,weights=x.w),'dom':x.domain.iloc[0]}))
    print(sp,'DOC acc %.3f'%accuracy_score(g.label,g.p>.5),'FPR %.3f'%(g[g.label==0].p>.5).mean() if (g.label==0).any() else '', 'recall %.3f'%(g[g.label==1].p>.5).mean())
    for dom,gg in g.groupby('dom'): print('  ',dom,'acc %.3f'%accuracy_score(gg.label,gg.p>.5))
