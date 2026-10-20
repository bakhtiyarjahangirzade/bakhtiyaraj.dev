import json, glob, random, re, pandas as pd
random.seed(7)
D='/home/claude/data_dl/'
rows=[]  # text,label(1=AI),domain,group,split-hint
def add(t,l,dom,grp):
    if isinstance(t,str):
        t=t.strip()
        if len(t.split())>=60: rows.append((t,l,dom,grp))
# ELLIPSE human ELL essays
e=pd.read_csv(D+'ELLIPSE-Corpus/ELLIPSE_Final_github_train.csv')
for t,p in zip(e.full_text,e.prompt): add(t,0,'essay','ellipse:'+str(p))
# ArguGPT machine essays
for f in ['train','dev','test','ood']:
    m=pd.read_csv(D+f'ArguGPT/data/argugpt/machine-{f}.csv')
    for t,mod in zip(m.text,m.model): add(t,1,'essay','argugpt-'+('ood' if f=='ood' else 'id')+':'+str(mod))
# M4 English domains, cap per file
seen=set()
for fp in glob.glob(D+'M4/data/*.jsonl'):
    dom=fp.split('/')[-1].split('_')[0]
    if dom not in ('arxiv','peerread','reddit','wikihow','wikipedia'): continue
    model=fp.split('_',1)[1].replace('.jsonl','').lower()
    n=0
    for line in open(fp):
        try: r=json.loads(line)
        except: continue
        h=r.get('human_text'); m=r.get('machine_text')
        if isinstance(h,list): h=' '.join(h)
        if isinstance(m,list): m=' '.join(m)
        if h and h[:200] not in seen and random.random()<0.35:
            seen.add(h[:200]); add(h,0,dom,dom+':human')
        if m and random.random()<0.35: add(m,1,dom,dom+':'+model)
        n+=1
df=pd.DataFrame(rows,columns=['text','label','domain','group'])
df=df.drop_duplicates('text')
# split: hold out argugpt-ood (gpt-4, claude-instant...) entirely as OOD test; random 70/15/15 else
df['split']=[ 'ood' if g.startswith('argugpt-ood') else random.choices(['train','cal','test'],[.7,.15,.15])[0] for g in df.group]
df.to_pickle('data.pkl')
print(df.groupby(['domain','label','split']).size().unstack(fill_value=0))
