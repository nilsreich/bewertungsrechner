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
const gradeInputsContainer = document.querySelector<HTMLDivElement>('#gradeInputsContainer');
const gradeCountDisplay = document.querySelector<HTMLDivElement>('#gradeCountDisplay');
const averageDisplay = document.querySelector<HTMLDivElement>('#averageDisplay');
const distributionBar = document.querySelector<HTMLDivElement>('#distributionBar');
const distributionLegend = document.querySelector<HTMLDivElement>('#distributionLegend');
const shareButton = document.querySelector<HTMLButtonElement>('#shareButton');

// --- Core Logic ---

/**
 * Updates URL search parameters based on current state
 */
function updateUrlParams(): void {
  const params = new URLSearchParams();
  
  const maxPoints = maxPointsInput?.value || '';
  if (maxPoints) params.set('m', maxPoints);
  
  const rounding = getActiveRounding();
  if (rounding !== 'down') params.set('r', rounding);
  
  const grades = Array.from(gradeInputsContainer?.querySelectorAll<HTMLInputElement>('input') || []);
  const gradeCounts = grades.map(input => input.value || '0').join(',');
  if (gradeCounts.split(',').some(c => c !== '0')) {
    params.set('g', gradeCounts);
  }

  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Saves the current application state to localStorage and URL
 */
function saveState(): void {
  const state = {
    maxPoints: maxPointsInput?.value || '',
    rounding: getActiveRounding(),
    grades: Array.from(gradeInputsContainer?.querySelectorAll<HTMLInputElement>('input') || []).reduce((acc, input) => {
      acc[input.dataset.grade || ''] = input.value;
      return acc;
    }, {} as Record<string, string>)
  };
  localStorage.setItem('bewertungsrechner_state', JSON.stringify(state));
  updateUrlParams();
}

/**
 * Loads the application state from URL or localStorage
 */
function loadState(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const saved = localStorage.getItem('bewertungsrechner_state');
  
  try {
    // 1. Priority: URL Parameters
    if (urlParams.has('m')) {
      if (maxPointsInput) maxPointsInput.value = urlParams.get('m') || '';
    } else if (saved) {
      const state = JSON.parse(saved);
      if (maxPointsInput && state.maxPoints !== undefined) maxPointsInput.value = state.maxPoints;
    }
    
    if (urlParams.has('r')) {
      const radio = Array.from(roundingInputs).find(input => input.value === urlParams.get('r'));
      if (radio) radio.checked = true;
    } else if (saved) {
      const state = JSON.parse(saved);
      if (state.rounding) {
        const radio = Array.from(roundingInputs).find(input => input.value === state.rounding);
        if (radio) radio.checked = true;
      }
    }
    
    if (urlParams.has('g')) {
      const counts = urlParams.get('g')?.split(',') || [];
      counts.forEach((count, index) => {
        const input = gradeInputsContainer?.querySelector<HTMLInputElement>(`input[data-grade="${index + 1}"]`);
        if (input) input.value = count === '0' ? '' : count;
      });
    } else if (saved) {
      const state = JSON.parse(saved);
      if (state.grades && gradeInputsContainer) {
        Object.entries(state.grades).forEach(([grade, count]) => {
          const input = gradeInputsContainer.querySelector<HTMLInputElement>(`input[data-grade="${grade}"]`);
          if (input) input.value = count as string;
        });
      }
    }
  } catch (e) {
    console.error("Failed to load state:", e);
  }
}

/**
 * Initializes the grade average calculator section with traditional grades (1-6)
 */
function initGradeCalculator(): void {
  if (!gradeInputsContainer) return;

  // Create inputs for grades 1 to 6
  for (let i = 1; i <= 6; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = "flex flex-col items-center space-y-1";
    
    // Label for the Grade
    const label = document.createElement('label');
    label.className = "text-[9px] font-bold text-slate-400 dark:text-neutral-600 uppercase";
    label.innerText = `Note ${i}`;
    
    // Input for the count of these grades
    const input = document.createElement('input');
    input.type = "number";
    input.min = "0";
    input.placeholder = "0";
    input.dataset.grade = i.toString();
    input.className = "w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg p-1.5 text-center text-sm font-bold text-slate-700 dark:text-neutral-300 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all";
    
    input.addEventListener('input', () => {
      calculateAverage();
      saveState();
    });
    
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    gradeInputsContainer.appendChild(wrapper);
  }
}

/**
 * Calculates and renders the average and distribution for traditional grades
 */
function calculateAverage(): void {
  const inputs = gradeInputsContainer?.querySelectorAll<HTMLInputElement>('input');
  if (!inputs || !gradeCountDisplay || !averageDisplay || !distributionBar || !distributionLegend) return;

  let totalGradeValue = 0;
  let totalGrades = 0;
  
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const colors: Record<number, string> = {
    1: 'bg-teal-500',
    2: 'bg-emerald-500',
    3: 'bg-lime-500',
    4: 'bg-yellow-500',
    5: 'bg-orange-500',
    6: 'bg-red-500'
  };

  inputs.forEach(input => {
    const count = parseInt(input.value) || 0;
    const grade = parseInt(input.dataset.grade || '0');
    
    if (count > 0) {
      totalGradeValue += (grade * count);
      totalGrades += count;
      distribution[grade] = count;
    }
  });

  const average = totalGrades > 0 ? (totalGradeValue / totalGrades) : 0;
  
  // Update displays
  gradeCountDisplay.innerText = totalGrades.toString();
  averageDisplay.innerText = average.toFixed(2);

  // Render Graphical Distribution
  distributionBar.replaceChildren();
  distributionLegend.replaceChildren();

  const maxCount = Math.max(...Object.values(distribution), 1);

  Object.entries(distribution).forEach(([grade, count]) => {
    // Column/Bar segment
    const percentageOfMax = (count / maxCount) * 100;
    
    const colWrapper = document.createElement('div');
    colWrapper.className = "flex-1 flex flex-col items-center justify-end h-full group";
    
    const countLabel = document.createElement('div');
    countLabel.className = "text-[10px] font-black mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 dark:text-neutral-400";
    countLabel.innerText = count > 0 ? count.toString() : '';

    const column = document.createElement('div');
    column.className = `${colors[Number(grade)]} w-full rounded-t-lg transition-all duration-700 ease-out`;
    column.style.height = count > 0 ? `${Math.max(percentageOfMax, 5)}%` : '2px';
    if (count === 0) column.classList.add('opacity-10');

    const gradeLabel = document.createElement('div');
    gradeLabel.className = "text-[9px] font-bold mt-2 text-slate-400 dark:text-neutral-600";
    gradeLabel.innerText = grade;

    colWrapper.appendChild(countLabel);
    colWrapper.appendChild(column);
    colWrapper.appendChild(gradeLabel);
    distributionBar.appendChild(colWrapper);

    if (count > 0) {
      // Legend item
      const legendItem = document.createElement('div');
      legendItem.className = "flex items-center space-x-1.5";
      legendItem.innerHTML = `
        <span class="w-2 h-2 rounded-full ${colors[Number(grade)]}"></span>
        <span>Note ${grade}: ${count}</span>
      `;
      distributionLegend.appendChild(legendItem);
    }
  });
}

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

maxPointsInput?.addEventListener('input', () => {
  updateTable();
  saveState();
});

/**
 * Handles keyboard "Enter" or "Done" to blur the input and hide mobile keyboard
 */
maxPointsInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    maxPointsInput.blur();
  }
});

roundingInputs.forEach(input => input.addEventListener('change', () => {
  updateTable();
  saveState();
}));

shareButton?.addEventListener('click', async () => {
  const url = window.location.href;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'MSS Notenrechner',
        text: 'Meine Notenberechnung',
        url: url
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  } else {
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      const originalText = shareButton.innerHTML;
      shareButton.innerHTML = 'Kopiert!';
      setTimeout(() => {
        shareButton.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
});

// --- Lifecycle ---

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initGradeCalculator();
    loadState();
    updateTable();
    calculateAverage();
  });
} else {
  initGradeCalculator();
  loadState();
  updateTable();
  calculateAverage();
}
