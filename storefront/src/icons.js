// One outline icon set on a 24-unit grid, matching the floating navigation icons (stroke via CSS: .ic).
const svg=d=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
export const icon={
 arrow:svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
 external:svg('<path d="M7 17 17 7M9 7h8v8"/>'),
 down:svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
 back:svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
 check:svg('<path d="m5 12.5 4.2 4.2L19 7"/>'),
 plus:svg('<path d="M12 5v14M5 12h14"/>'),
 chat:svg('<path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9l-6 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>')
};
