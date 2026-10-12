import { mountGame } from '../shared/table.js';
import { engine } from './engine.js';
import { pokerUI } from './ui.js';
mountGame({
  id: 'poker', title: 'Poker', serial: 'BKY-C03', tagline: "Texas Hold'em · no limit · play chips · 2–6 players",
  minPlayers: 2, maxPlayers: 6, modes: ['bot', 'online'], defaults: { players: 6 },
  options: [{ key: 'players', label: 'Players', modes: ['bot'], values: [[2, 'Heads-up'], [4, '4 players'], [6, '6 players']] }],
  rules: [
    "Texas Hold'em: everyone gets two private cards, then five shared cards come out (flop 3, turn 1, river 1). Make the best five-card hand.",
    'Each betting round you can fold, check or call, or bet/raise. No limit: you can go all-in at any time. Blinds double every 10 hands.',
    'Hand ranks from high to low: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair, high card.',
    'Everyone starts with 2,000 play chips. They have no money value. The last player with chips wins the table.'
  ],
  casino: { settled: st => st.phase === 'result' },
  engine, ui: pokerUI
});
