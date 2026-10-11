import { mountGame } from '../shared/table.js';
import { engine } from './engine.js';
import { durakUI } from './ui.js';
mountGame({
  id: 'durak', title: 'Durak', serial: 'BKY-G03', tagline: 'Throw-in durak · 36 cards · 2–4 players',
  minPlayers: 2, maxPlayers: 4, modes: ['bot', 'online'], defaults: { players: 2 },
  options: [{ key: 'players', label: 'Players', modes: ['bot'], values: [[2, '2 players'], [3, '3 players'], [4, '4 players']] }],
  rules: [
    'A 36-card deck (6 to ace). Everyone gets 6 cards. The card under the deck sets the trump suit. The player with the lowest trump attacks first.',
    'The attacker plays a card at the defender. The defender beats it with a higher card of the same suit, or with any trump if the attack is not a trump.',
    'Other players may throw in cards whose rank is already on the table, up to 6 attacks and never more than the defender can answer.',
    'If every attack is beaten and the attackers press Done, the cards are discarded (bito) and the defender attacks next. If the defender takes, they pick up everything and miss their attack.',
    'After each bout hands are refilled to 6 from the deck. When the deck is empty, players who run out of cards are safe. The last player holding cards is the durak.'
  ],
  engine, ui: durakUI
});
