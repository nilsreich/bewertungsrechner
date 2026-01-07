import './style.css';

/**
 * Interfaces für die MSS-Daten
 */
interface ScaleEntry {
  mss: number;
  pct: number;
}

type RoundingMode = 'none' | 'down' | 'half' | 'up';

// --- Configuration & Constants ---

/** MSS score mapping definitions with their corresponding percentage thresholds */
const MSS_SCALE: ScaleEntry[] = [
  { mss: 15, pct: 96 }, { mss: 14, pct: 91 }, { mss: 13, pct: 86 },
  { mss: 12, pct: 81 }, { mss: 11, pct: 76 }, { mss: 10, pct: 71 },
  { mss: 9,  pct: 66 }, { mss: 8,  pct: 61 }, { mss: 7,  pct: 56 },
  { mss: 6,  pct: 51 }, { mss: 5,  pct: 46 }, { mss: 4,  pct: 41 },
  { mss: 3,  pct: 34 }, { mss: 2,  pct: 27 }, { mss: 1,  pct: 20 },
  { mss: 0,  pct: 0 }
];

// --- DOM References ---

const maxPointsInput = document.querySelector<HTMLInputElement>('#maxPoints');
const tableBody = document.querySelector<HTMLTableSectionElement>('#tableBody');
const roundingInputs = document.querySelectorAll<HTMLInputElement>('input[name="rounding"]');

// --- Core Logic ---

/**
 * Determines the currently selected rounding strategy from the radio group.
 * Defaults to 'down' if none is found.
 */
function getActiveRounding(): RoundingMode {
  const checkedInput = Array.from(roundingInputs).find(input => input.checked);
  return (checkedInput?.value as RoundingMode) || 'down';
}

/**
 * Applies the selected mathematical rounding logic to a raw point value.
 * @param val - The raw calculated point value
 * @param mode - The rounding strategy to apply
 */
function calculatePoints(val: number, mode: RoundingMode): number {
  if (val === 0) return 0;
  
  const strategy: Record<RoundingMode, (v: number) => number> = {
    'up': Math.ceil,
    'down': Math.floor,
    'half': (v) => Math.round(v * 2) / 2,
    'none': (v) => v
  };

  return strategy[mode](val);
}

/**
 * Main render function. Reads inputs, calculates point thresholds,
 * and updates the DOM table.
 */
function updateTable(): void {
  if (!maxPointsInput || !tableBody) return;

  // Sanitize input: allow German comma as decimal separator
  const max = parseFloat(maxPointsInput.value.replace(',', '.')) || 0;
  const mode = getActiveRounding();
  
  // Clear existing table content efficiently
  tableBody.replaceChildren();

  // Generate table rows based on the scale
  MSS_SCALE.forEach((entry) => {
    const rawPoints = max * (entry.pct / 100);
    const roundedPoints = calculatePoints(rawPoints, mode);
    const effectivePct = max > 0 ? (roundedPoints / max * 100) : 0;
    
    // UI Helpers: Border logic for grouping MSS grades (increments of 3)
    const isStep = entry.mss % 3 === 0 && entry.mss !== 0 && entry.mss !== 15;
    const borderClass = isStep 
      ? 'border-t-2 border-slate-200 dark:border-neutral-800' 
      : 'border-t border-slate-100 dark:border-neutral-900/50';
    
    // Visual encoding for performance brackets
    let mssColor = "text-slate-400 dark:text-neutral-500";
    let pointsColor = "text-slate-900 dark:text-white";
    let rowBg = "bg-transparent";
    
    if (entry.mss >= 13) {
      // High performance (13-15 MSS) - Teal
      mssColor = "text-teal-600 dark:text-teal-400 font-bold";
      if (max > 0) rowBg = "bg-teal-500/[0.03]";
    } else if (entry.mss < 5) {
      // Low performance (0-4 MSS) - Red
      mssColor = "text-red-600 dark:text-red-500/60";
      if (max > 0) rowBg = "bg-red-500/[0.03]";
    }

    // Percentage display logic (Target vs. Actual)
    let pctDisplay = `<div class="font-bold text-xs text-slate-600 dark:text-neutral-300">${entry.pct}%</div>`;
    if (max > 0) {
      pctDisplay += `<div class="text-[9px] text-slate-400 dark:text-neutral-600 font-bold tracking-tight mt-0.5 uppercase">IST: ${effectivePct.toFixed(1)}%</div>`;
    }

    const row = document.createElement('tr');
    row.className = `${borderClass} ${rowBg} hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors`;
    row.innerHTML = `
      <td class="p-4 sm:p-5 text-left font-bold font-mono text-xl ${mssColor}">
        ${entry.mss.toString().padStart(2, '0')}
      </td>
      <td class="p-4 sm:p-5 text-center leading-tight">
        ${pctDisplay}
      </td>
      <td class="p-4 sm:p-5 text-right font-black font-mono text-xl ${max > 0 ? pointsColor : 'text-slate-200 dark:text-neutral-800'}">
        ${max > 0 ? roundedPoints.toLocaleString('de-DE', { 
          minimumFractionDigits: (mode === 'half' || mode === 'none') ? (mode === 'none' ? 2 : 1) : 0,
          maximumFractionDigits: 2
        }) : '—'}
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// --- Event Handlers ---

maxPointsInput?.addEventListener('input', updateTable);

/**
 * Handles keyboard "Enter" or "Done" to blur the input and hide mobile keyboard
 */
maxPointsInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    maxPointsInput.blur();
  }
});

roundingInputs.forEach(input => input.addEventListener('change', updateTable));

// --- Lifecycle ---

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateTable);
} else {
  updateTable();
}