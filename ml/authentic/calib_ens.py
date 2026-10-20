"""Split-conformal 98% half-widths for the ensemble on synthetic mixed essays (cal split), checked on test."""
import pandas as pd, numpy as np, json
S = pd.read_pickle('scored_ens.pkl'); S['w'] = S.text.str.split().str.len()
bucket = lambda n: 0 if n == 1 else 1 if n <= 3 else 2 if n <= 6 else 3
def mix(sp, N, col):
    d = S[(S.split == sp) & (S.domain == 'essay')]; H, A = d[d.label == 0], d[d.label == 1]; r = np.random.default_rng(7); out = []
    for _ in range(N):
        n = int(r.integers(1, 11)); u = r.random(); f = 0.0 if u < .3 else 1.0 if u < .5 else r.random(); k = int(round(f * n))
        x = pd.concat([H.sample(n - k, random_state=int(r.integers(1e9))), A.sample(k, random_state=int(r.integers(1e9)))])
        w = x.w.values; out.append((bucket(n), (w * x.label.values).sum() / w.sum(), (w * x[col].values).sum() / w.sum()))
    return pd.DataFrame(out, columns=['b', 'true', 'pred'])
res = {}
for wa in (1.0, 0.7):
    S['pe'] = wa * S.pA + (1 - wa) * S.pB
    cal, te = mix('cal', 15000, 'pe'), mix('test', 15000, 'pe'); q = {}
    for b, g in cal.groupby('b'):
        r = np.abs(g.true - g.pred).values; n = len(r); q[int(b)] = float(np.quantile(r, min(1, np.ceil((n + 1) * .98) / n), method='higher'))
    lo = np.clip(te.pred - te.b.map(q), 0, 1); hi = np.clip(te.pred + te.b.map(q), 0, 1)
    print(wa, q, 'coverage %.4f' % ((te.true >= lo) & (te.true <= hi)).mean())
    res[str(wa)] = q
json.dump(res, open('conformal_ens.json', 'w'))
