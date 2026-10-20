# Authentic detector: training pipeline

CPU-only, about 5 minutes end to end. Produces `supabase/functions/authentic/model.json`.

| Step | Script | Output |
| --- | --- | --- |
| 1. Data | `prep.py` | `data.pkl`: human vs AI texts with train / cal / test / ood splits |
| 2. Train | `ens.py` | `ens.pkl`: model A (hashed word/stylometric features, logistic regression C=8) + model B (character 3-5-grams, SGD log-loss); `tune.py` is the sweep used to pick them |
| 3. Calibrate | `calib_ens.py` | `conformal_ens.json`: split-conformal 98% half-widths per paragraph-count bucket, essays only |
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

## v3 (2026.10-v3): more 2025-era data, calibrated and adaptive ranges

- 405 essays by a 2025-era model (`gen_1..9`), now including grade-9 writing, learner English
  (Spanish, Chinese, Arabic, Russian, Turkish, Azerbaijani, Korean, Persian L1), and essays that were
  polished then roughened. Split 70/15/15 so calibration and test also contain modern text (`ens2.py`).
- Paragraph scores go through isotonic calibration (fitted on half the calibration split), so a
  "70% AI" paragraph is right about 70% of the time.
- Ranges use normalised split-conformal (`conf2.py`): half-width = q[bucket] x (sqrt(u) + 0.05), where
  u is the word-weighted mean of p(1-p). Confident documents get narrow ranges.

| Test | v2 | v3 |
| --- | --- | --- |
| Mean range width (essays + modern, 98%) | 0.48 | 0.29 |
| Coverage of the 98% range | 98.7% | 98.3% |
| 2025-era essays, unseen prompts (40) | 35/40 | 36/40 |
| Unseen models (ArguGPT OOD) | 96.2% | 97.4% |
| Human essays with lower bound > 50% | 0.00% | 0.07% |

## v2 (2026.10-v2): ensemble

Sweep over C, modern-essay weight, hash size and character n-grams (`tune.py`). The final model is
0.7 x A + 0.3 x B. Character n-grams catch more 2025-era text; the 0.7/0.3 mix keeps false alarms on
English-learner essays low. 2^20 features with char n-grams ran out of memory on the 7 GB build box.

| Test | v1 | v2 |
| --- | --- | --- |
| Essays, document accuracy | 99.0% | 98.7% |
| 2025-era model essays (40, unseen prompts) | 31/40 | 35/40 |
| Unseen models (ArguGPT OOD) | 96.2% | 96.2% |
| 98% interval coverage, essays | 98.9% | 98.7% |
| Human essays with lower bound > 50% AI | 0.00% | 0.00% |

## Results (model 2026.10-v1)

| Test | Result |
| --- | --- |
| Essays, held-out, document level | 99.0% accuracy |
| Unseen models and prompts (ArguGPT OOD: GPT-4, Claude Instant, ...) | 96.2% detected |
| 2025-era model essays, 4 styles (40 docs) | 31/40 detected; "write like a student" style is the weak spot |
| 98% interval coverage, held-out essays | 98.9%; half-width 0.57 (1 paragraph) to 0.23 (7+) |
| Fully human essays reported as >50% AI | 0.01% (20k synthetic documents) |
| Segment accuracy, all domains | 90.8% (arXiv abstracts weakest: 26% human false-positive) |
