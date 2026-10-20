# Authentic detector: training pipeline

CPU-only, about 5 minutes end to end. Produces `supabase/functions/authentic/model.json`.

| Step | Script | Output |
| --- | --- | --- |
| 1. Data | `prep.py` | `data.pkl`: human vs AI texts with train / cal / test / ood splits |
| 2. Train | `train.py [C]` | `model.pkl`, `scored.pkl` (segment-level logistic regression on hashed features) |
| 3. Calibrate | `ESSAY=1 calib.py` | `conformal.json`: split-conformal 98% half-widths per paragraph-count bucket |
| 4. Modern check | `modern_eval.py` | detection rate on `modern_test.jsonl` (2025-era model, unseen prompts) |
| 5. Export | `export.py <version>` | int8 weights + conformal table for the edge function |

`feats.py` defines features and segmentation. `supabase/functions/authentic/detector.js` must match it
exactly; `tests/authentic.test.mjs` checks parity against `tests/fixtures/authentic-parity.json`.

## Data (not committed)

`prep.py` expects these public research corpora under `/home/claude/data_dl/` (edit `D`):

- ELLIPSE corpus (English-language learner essays, CC BY-NC-SA 4.0): github.com/scrosseye/ELLIPSE-Corpus
- ArguGPT machine essays: github.com/huhailinguist/ArguGPT
- M4 (arXiv, Reddit, WikiHow, Wikipedia, PeerRead; human + 6 models): github.com/mbzuai-nlp/M4
- `gen_*.jsonl`: 225 essays and assignments written by a 2025-era model in five styles (committed).

**Licensing:** ELLIPSE is non-commercial and ArguGPT / M4 are research releases. Before charging for
the service, retrain on commercially licensed data (for example your own anonymised pre-2020 student
work, with permission) and drop the non-commercial sets.

## Results (model 2026.10-v1)

| Test | Result |
| --- | --- |
| Essays, held-out, document level | 99.0% accuracy |
| Unseen models and prompts (ArguGPT OOD: GPT-4, Claude Instant, ...) | 96.2% detected |
| 2025-era model essays, 4 styles (40 docs) | 31/40 detected; "write like a student" style is the weak spot |
| 98% interval coverage, held-out essays | 98.9%; half-width 0.57 (1 paragraph) to 0.23 (7+) |
| Fully human essays reported as >50% AI | 0.01% (20k synthetic documents) |
| Segment accuracy, all domains | 90.8% (arXiv abstracts weakest: 26% human false-positive) |
