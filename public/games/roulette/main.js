import { mountGame } from '../shared/table.js';
import { engine } from './engine.js';
import { rouletteUI } from './ui.js';
mountGame({
  id: 'roulette', title: 'Roulette', serial: 'BKY-C02', tagline: 'European single-zero · play chips only',
  minPlayers: 1, maxPlayers: 6, modes: ['bot', 'online'], defaults: { players: 3 },
  options: [{ key: 'players', label: 'Seats', modes: ['bot'], values: [[1, 'Just me'], [3, 'Me + 2 bots'], [6, 'Me + 5 bots']] }],
  rules: [
    'Pick a chip value, then click the table to place bets: single numbers pay 35 to 1, dozens and columns pay 2 to 1, red/black, odd/even and 1–18/19–36 pay 1 to 1.',
    'When everyone has pressed Spin, the wheel spins once for the whole table. Zero is green and loses all outside bets.',
    'Everyone starts with 1,000 play chips. They have no money value; if you run out you can rebuy for free.'
  ],
  casino: { settled: st => st.phase === 'result' || st.phase === 'bet' },
  engine, ui: rouletteUI
});
