import { mountGame } from '../shared/table.js';
import { engine } from './engine.js';
import { dominoUI } from './ui.js';
mountGame({
  id: 'domino', title: 'Domino', serial: 'BKY-G04', tagline: 'Double-six draw game · 2–4 players',
  minPlayers: 2, maxPlayers: 4, modes: ['bot', 'online'], defaults: { players: 2, target: 100 },
  options: [
    { key: 'players', label: 'Players', modes: ['bot'], values: [[2, '2 players'], [3, '3 players'], [4, '4 players']] },
    { key: 'target', label: 'Play to', values: [[50, '50 points'], [100, '100 points'], [150, '150 points']] }
  ],
  rules: [
    'A double-six set of 28 tiles. With 2 players everyone takes 7 tiles; with 3 or 4 players, 5 tiles. The rest is the boneyard.',
    'The highest double starts the first round. Play a tile whose number matches one open end of the line.',
    "If nothing fits, draw from the boneyard until something does. If the boneyard is empty, pass.",
    'Empty your hand to win the round and score the pips left in everyone else\'s hands. If nobody can move, the lowest hand wins the blocked round.',
    'First to the target score wins.'
  ],
  engine, ui: dominoUI
});
