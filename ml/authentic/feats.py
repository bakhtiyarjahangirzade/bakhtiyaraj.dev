import re, math
import os
NOLEX=os.environ.get('NOLEX')=='1'
FUNC=set("""a about above after again against all also although am an and any are as at be because been before being below between both but by can could did do does doing down during each either even ever every few for from further had has have having he her here hers herself him himself his how however i if in into is it its itself just least less like many may me might more most moreover much must my myself neither no nor not now of off often on once one only or other others otherwise our ours ourselves out over own perhaps quite rather really same several shall she should since so some such than that the their theirs them themselves then there therefore these they this those though through thus to too under until up upon very was we well were what whatever when where whether which while who whom whose why will with within without would yet you your yours yourself yourselves furthermore additionally overall ultimately significant significantly crucial essential various numerous important ensure however instance example conclusion firstly secondly lastly finally believe think people things lot get got really thing very kind sort""".split())
SP=re.compile(r"[  -​  　﻿]")
def norm(t):
    t=SP.sub(' ',t)
    t=t.replace('’',"'").replace('‘',"'").replace('“','"').replace('”','"').replace('—',' -- ').replace('–','-')
    return t
TOK=re.compile(r"[a-z]+(?:'[a-z]+)?|[0-9]+|[^\sa-z0-9]")
SENT=re.compile(r"(?<=[.!?])\s+")
def shape(w):
    if w[0].isdigit(): return 'N'
    if not w[0].isalpha(): return w
    if w in FUNC: return w
    n=len(w); return 'Ws' if n<=3 else ('Wm' if n<=6 else ('Wl' if n<=9 else 'Wx'))
def b(x,cuts):
    for i,c in enumerate(cuts):
        if x<c: return i
    return len(cuts)
def features(text):
    t=norm(text)
    low=t.lower()
    toks=TOK.findall(low)
    m=[shape(w) for w in toks]
    f=[]
    for n in (1,2,3,4):
        for i in range(len(m)-n+1): f.append('m%d:'%n+' '.join(m[i:i+n]))
    words=[w for w in toks if w[0].isalpha()]
    if not NOLEX:
      for w in words: f.append('w:'+w)
      for i in range(len(words)-1): f.append('b:'+words[i]+' '+words[i+1])
    # stylometry buckets
    sents=[s for s in SENT.split(t.strip()) if s]
    L=[len(TOK.findall(s.lower())) for s in sents] or [0]
    mu=sum(L)/len(L); sd=math.sqrt(sum((x-mu)**2 for x in L)/len(L))
    cv=sd/mu if mu else 0
    nw=max(len(words),1)
    ttr=len(set(words[:150]))/max(min(len(words),150),1)
    awl=sum(len(w) for w in words)/nw
    caps=sum(1 for s in sents if s[:1].islower())/max(len(sents),1)
    typo=sum(1 for w in toks if w in ('i',))/nw  # lowercase standalone i
    for name,val,cuts in (('sl',mu,[8,12,16,20,25,30]),('cv',cv,[.2,.3,.4,.5,.65,.8]),('ttr',ttr,[.4,.5,.55,.6,.65,.7,.8]),('awl',awl,[3.8,4.2,4.5,4.8,5.1,5.5]),('lc',caps,[.01,.1,.3]),('li',typo,[.001,.01,.03])):
        f.append('s:%s%d'%(name,b(val,cuts)))
    return f
def segments(text,lo=50,hi=220):
    t=norm(text).replace('\r','')
    paras=[p.strip() for p in re.split(r"\n\s*\n|\n(?=[A-Z])",t) if p.strip()]
    out=[];buf=''
    for p in paras:
        if len(p.split())>hi:
            ss=SENT.split(p);cur=''
            for s in ss:
                if len((cur+' '+s).split())>hi and len(cur.split())>=lo: out.append(cur.strip());cur=s
                else: cur=(cur+' '+s).strip()
            p=cur
        buf=(buf+'\n'+p).strip() if buf else p
        if len(buf.split())>=lo: out.append(buf);buf=''
    if buf:
        if out and len(buf.split())<lo: out[-1]=out[-1]+'\n'+buf
        else: out.append(buf)
    return out
