import json,pickle,numpy as np,os
from feats import features, segments
from sklearn.feature_extraction.text import HashingVectorizer
from scipy.sparse import diags
w,b=pickle.load(open(os.environ.get('M','model.pkl'),'rb'))
hv=HashingVectorizer(analyzer=features,n_features=2**18,alternate_sign=False,norm=None)
def P(ts):
    M=hv.transform(ts).astype(np.float32); M.data=np.log1p(M.data); n=np.sqrt(M.multiply(M).sum(1)).A1; n[n==0]=1
    z=(diags(1/n)@M)@w+b; return 1/(1+np.exp(-z))
rows=[json.loads(l) for l in open('modern_test.jsonl') if l.strip()]
from collections import defaultdict; acc=defaultdict(list)
for r in rows:
    s=segments(r['text']); p=P(s); ww=[len(x.split()) for x in s]
    acc[r['style']].append(np.average(p,weights=ww))
for k,v in acc.items(): print(k,'mean %.2f'%np.mean(v),'detected %d/%d'%(sum(x>.5 for x in v),len(v)))
