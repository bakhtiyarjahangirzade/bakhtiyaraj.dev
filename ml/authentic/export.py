"""Quantise model.pkl (sqrt-companded int8) + conformal.json into the edge function's model.json."""
import pickle, numpy as np, json, base64, sys
w, b = pickle.load(open('model.pkl', 'rb'))
s = float(np.sqrt(np.abs(w)).max() / 127)
q = np.round(np.sign(w) * np.sqrt(np.abs(w)) / s).astype(np.int8)
c = json.load(open('conformal.json'))['soft']
ver = sys.argv[1] if len(sys.argv) > 1 else 'dev'
json.dump({'v': ver, 'nf': 2**18, 's': s, 'b': float(b), 'q': {str(k): round(v, 4) for k, v in c.items()},
           'w': base64.b64encode(q.tobytes()).decode()}, open('../../supabase/functions/authentic/model.json', 'w'))
