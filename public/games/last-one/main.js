import { mountGame } from '../shared/table.js';
import { engine } from './engine.js';
import { lastOneUI } from './ui.js';
mountGame({
  id: 'last-one', title: 'Last One', serial: 'BKY-G02', tagline: 'Uno-style card game · 2–4 players',
  minPlayers: 2, maxPlayers: 4, modes: ['bot', 'online'], defaults: { players: 4 }, felt: 'red',
  options: [{ key: 'players', label: 'Players', modes: ['bot'], values: [[2, '2 players'], [3, '3 players'], [4, '4 players']] }],
  rules: [
    'Everyone starts with 7 cards. On your turn, play a card that matches the top card by color or by number/symbol, or play a wild.',
    'Skip ⊘ skips the next player. Reverse ⇄ changes direction (with 2 players it acts as skip). +2 makes the next player draw two and lose their turn. Wild picks the color; Wild +4 also makes the next player draw four.',
    "Can't play? Draw one card. If it fits you may play it right away, otherwise your turn passes.",
    'When you are about to have one card left, press Call LAST! before playing. If you forget, anyone can catch you and you draw 2.',
    'First player out of cards wins.'
  ],
  engine, ui: lastOneUI
});
