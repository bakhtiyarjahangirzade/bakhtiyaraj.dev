import { mountGame } from '../shared/table.js';
import { engine } from './engine.js';
import { blackjackUI } from './ui.js';
mountGame({
  id: 'blackjack', title: 'Blackjack', serial: 'BKY-C01', tagline: 'Play chips only · up to 5 players vs the dealer',
  minPlayers: 1, maxPlayers: 5, modes: ['bot', 'online'], defaults: { players: 3 },
  options: [{ key: 'players', label: 'Seats', modes: ['bot'], values: [[1, 'Just me'], [2, 'Me + 1 bot'], [3, 'Me + 2 bots'], [5, 'Me + 4 bots']] }],
  rules: [
    'Everyone plays against the dealer, not against each other. Get closer to 21 than the dealer without going over.',
    'Cards 2–10 count their number, J/Q/K count 10, aces count 1 or 11. A blackjack (ace + 10-value card) pays 3 to 2.',
    'Hit to take a card, Stand to stop, Double to double your bet and take exactly one card, Split to play a pair as two hands.',
    'The dealer draws to 17 and stands on all 17s. A push returns your bet.',
    'Everyone starts with 1,000 play chips. These chips have no money value; if you run out you can rebuy for free.'
  ],
  casino: { settled: st => st.phase === 'settle' || st.phase === 'bet' },
  engine, ui: blackjackUI
});
