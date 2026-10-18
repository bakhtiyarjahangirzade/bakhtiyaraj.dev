// Runs the chess bot off the main thread so the page never freezes while it thinks.
import { engine } from './engine.js';
onmessage = e => { const { id, state, seat, opts } = e.data; let a = null; try { a = engine.bot(state, seat, opts); } catch {} postMessage({ id, a }); };
