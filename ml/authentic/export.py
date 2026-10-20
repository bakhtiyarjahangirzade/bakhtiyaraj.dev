"""Pack ens.pkl (base LR + char SGD) and the conformal table into the edge function's model.json.
Weights are sqrt-companded int8. Usage: python3 export.py 2026.10-v2"""
import pickle, numpy as np, json, base64, sys
E = pickle.load(open('ens.pkl', 'rb'))
q = json.load(open('conformal_ens.json'))['0.7']
def pack(w, b, kind, weight):
    s = float(np.sqrt(np.abs(w)).max() / 127)
    qq = np.round(np.sign(w) * np.sqrt(np.abs(w)) / s).astype(np.int8)
    return {'kind': kind, 'weight': weight, 'nf': len(w), 's': s, 'b': float(b), 'w': base64.b64encode(qq.tobytes()).decode()}
json.dump({'v': sys.argv[1] if len(sys.argv) > 1 else 'dev', 'q': {k: round(v, 4) for k, v in q.items()},
           'models': [pack(*E['A'], 'base', 0.7), pack(*E['B'], 'char', 0.3)]},
          open('../../supabase/functions/authentic/model.json', 'w'))
