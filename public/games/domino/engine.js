// Draw dominoes (double-six). Rounds until someone reaches the target score. JSON state, host-authoritative.
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clone = s => JSON.parse(JSON.stringify(s));
export const pipsOf = t => t.a + t.b;
export function ends(s) { if (!s.line.length) return null; return [s.line[0].a, s.line[s.line.length - 1].b]; }
export function fits(s, t) {
  const e = ends(s); if (!e) return ['L'];
  const out = []; if (t.a === e[0] || t.b === e[0]) out.push('L'); if (t.a === e[1] || t.b === e[1]) out.push('R');
  return out;
}
function deal(s, starter) {
  const set = []; let id = 0;
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) set.push({ id: id++, a, b });
  shuffle(set);
  const k = s.n === 2 ? 7 : 5;
  s.hands = []; for (let i = 0; i < s.n; i++) s.hands.push(set.splice(0, k));
  s.bone = set; s.line = []; s.passes = 0;
  if (starter == null) {
    let best = -1; starter = 0;
    s.hands.forEach((h, i) => h.forEach(t => { const v = t.a === t.b ? 100 + t.a : t.a + t.b; if (v > best) { best = v; starter = i; } }));
  }
  s.turn = starter;
}
function endRound(s, winner, blocked) {
  const totals = s.hands.map(h => h.reduce((x, t) => x + pipsOf(t), 0));
  if (blocked) { const low = Math.min(...totals); winner = totals.indexOf(low); }
  const pts = totals.reduce((x, v, i) => i === winner ? x : x + v, 0);
  s.scores[winner] += pts;
  s.last = { winner, pts, blocked, round: s.round };
  s.msg = `Seat ${winner + 1} ${blocked ? 'wins the blocked round' : 'dominoes'} · +${pts}`;
  if (s.scores[winner] >= s.target) { s.winner = winner; return; }
  s.round++; deal(s, winner);
}
export const engine = {
  setup(n, opts) {
    const s = { n, scores: Array(n).fill(0), target: +(opts?.target || 100), round: 1, winner: null, last: null, msg: 'Highest double starts', seq: 0 };
    deal(s); return s;
  },
  toAct(s) { return s.winner != null ? [] : [s.turn]; },
  act(s0, seat, a) {
    if (s0.winner != null) throw new Error('The game is over.');
    if (seat !== s0.turn) throw new Error("It's not your turn.");
    const s = clone(s0); s.seq++;
    const hand = s.hands[seat];
    const canPlay = hand.some(t => fits(s, t).length);
    if (a.type === 'play') {
      const i = hand.findIndex(t => t.id === a.id); if (i < 0) throw new Error('That tile is not in your hand.');
      const t = hand[i], sides = fits(s, t);
      if (!sides.length) throw new Error("That tile doesn't match either end.");
      const side = sides.includes(a.side) ? a.side : sides[0];
      hand.splice(i, 1);
      if (!s.line.length) s.line.push({ ...t });
      else if (side === 'L') { const e = s.line[0].a; s.line.unshift(t.b === e ? { ...t } : { id: t.id, a: t.b, b: t.a }); }
      else { const e = s.line[s.line.length - 1].b; s.line.push(t.a === e ? { ...t } : { id: t.id, a: t.b, b: t.a }); }
      s.passes = 0; s.msg = '';
      if (!hand.length) { endRound(s, seat, false); return s; }
      s.turn = (seat + 1) % s.n; return s;
    }
    if (a.type === 'draw') {
      if (canPlay) throw new Error('You have a tile that fits. Play it.');
      if (!s.bone.length) throw new Error('The boneyard is empty. Pass instead.');
      hand.push(s.bone.pop()); s.msg = 'Seat ' + (seat + 1) + ' draws'; return s;
    }
    if (a.type === 'pass') {
      if (canPlay) throw new Error('You have a tile that fits. Play it.');
      if (s.bone.length) throw new Error('Draw from the boneyard first.');
      s.passes++; s.msg = 'Seat ' + (seat + 1) + ' passes';
      if (s.passes >= s.n) { endRound(s, 0, true); return s; }
      s.turn = (seat + 1) % s.n; return s;
    }
    throw new Error('Unknown move.');
  },
  over(s) { if (s.winner == null) return null; return { title: 'Seat ' + (s.winner + 1) + ' wins', detail: `First to ${s.target} · ${s.scores.join(' – ')}`, winner: s.winner }; },
  botDelay() { return 850; },
  bot(s, seat) {
    const hand = s.hands[seat];
    const opts = hand.filter(t => fits(s, t).length).sort((x, y) => ((y.a === y.b) * 3 + pipsOf(y)) - ((x.a === x.b) * 3 + pipsOf(x)));
    if (!opts.length) return s.bone.length ? { type: 'draw' } : { type: 'pass' };
    const t = opts[0], sides = fits(s, t);
    // keep the end that matches more of our remaining tiles open
    let side = sides[0];
    if (sides.length === 2) {
      const e = ends(s), rest = hand.filter(x => x.id !== t.id);
      const score = sd => { const other = sd === 'L' ? e[1] : e[0]; const newEnd = sd === 'L' ? (t.a === e[0] ? t.b : t.a) : (t.a === e[1] ? t.b : t.a); return rest.filter(x => x.a === newEnd || x.b === newEnd || x.a === other || x.b === other).length; };
      side = score('L') >= score('R') ? 'L' : 'R';
    }
    return { type: 'play', id: t.id, side };
  }
};
