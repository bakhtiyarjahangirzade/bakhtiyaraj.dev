# BAKHY design direction

Personal developer content hub, initially in Turkish. The user rejected the
corporate blue layout and selected an experimental, bold direction with original
visuals and motion. Keep content honest about the early stage.

## Visual language

Oversized BAKHY typography intersects a locally generated rotating torus knot.
Dark aubergine, pale type, lilac wires and acid green express an experimental
personal workspace. Restrained project and editorial notes sections follow the hero.
No fabricated projects, testimonials or dashboard functionality.

## Token ownership

public/styles.css is the single token owner: background #17131e, panel #211a2d,
ink #f2eee9, muted #b4aabd, acid #d6f985, pink #e0a7f2, line #493e54.
Display: Arial Black / Segoe UI. Body: Segoe UI / Arial. Utility: Consolas.
Georgia italic provides contrast in the thesis and notes heading.

## Behavior

Native anchors navigate to real source destinations. A native toggle pauses and
resumes the decorative canvas with aria-pressed. Reduced-motion starts paused.
Animation stops offscreen and in hidden tabs. Without JS, all content and links
work and the unsupported motion control remains hidden. Visible keyboard focus,
one document scroller, stacked mobile composition. No tracking or dependencies.
