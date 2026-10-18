import { mountGame } from '../shared/table.js';
import { engine } from './engine.js';
import { chessUI } from './ui.js';

mountGame({
  id: 'chess', title: 'Chess', serial: 'BKY-G01', tagline: 'Two players · online, same screen or vs bot',
  minPlayers: 2, maxPlayers: 2,
  modes: ['bot', 'local', 'online'], serverModes: ['online'],
  defaults: { level: 2, players: 2 },
  options: [{ key: 'level', label: 'Bot level', modes: ['bot', 'online'], values: [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']] }],
  rules: [
    'Standard chess rules, including castling, en passant and promotion. White moves first.',
    'Click a piece to see its legal moves, then click a highlighted square. You can also drag pieces.',
    'Online: the room creator plays White. In Vs bots mode you play White against the bot.'
  ],
  engine, ui: chessUI
});
