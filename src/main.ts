import './style.css';
import { debounce } from './utils';

/**
 * Interfaces für die MSS-Daten
 */
interface ScaleEntry {
  mss: number;
  pct: number;
}

interface Student {
  name: string;
  points: string;
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
const clearMaxPoints = document.querySelector<HTMLButtonElement>('#clearMaxPoints');
const examTitleInput = document.querySelector<HTMLInputElement>('#examTitle');
const examDateInput = document.querySelector<HTMLInputElement>('#examDate');
const correctionDateInput = document.querySelector<HTMLInputElement>('#correctionDate');
const tableBody = document.querySelector<HTMLTableSectionElement>('#tableBody');
const roundingInputs = document.querySelectorAll<HTMLInputElement>('input[name="rounding"]');
const gradeCountDisplay = document.querySelector<HTMLDivElement>('#gradeCountDisplay');
const averageDisplay = document.querySelector<HTMLDivElement>('#averageDisplay');
const distributionBar = document.querySelector<HTMLDivElement>('#distributionBar');
const distributionLegend = document.querySelector<HTMLDivElement>('#distributionLegend');
const copyTableButton = document.querySelector<HTMLButtonElement>('#copyTableButton');
const resetGradesButton = document.querySelector<HTMLButtonElement>('#resetGradesButton');
const presetButtons = document.querySelectorAll<HTMLButtonElement>('.preset-btn');

// --- Student References ---
const importStudentsBtn = document.querySelector<HTMLButtonElement>('#importStudentsBtn');
const exportCsvButton = document.querySelector<HTMLButtonElement>('#exportCsvButton');
const csvImportInput = document.querySelector<HTMLInputElement>('#csvImportInput');
const importArea = document.querySelector<HTMLDivElement>('#importArea');
const studentNamesInput = document.querySelector<HTMLTextAreaElement>('#studentNamesInput');
const confirmImport = document.querySelector<HTMLButtonElement>('#confirmImport');
const cancelImport = document.querySelector<HTMLButtonElement>('#cancelImport');
const studentTableBody = document.querySelector<HTMLTableSectionElement>('#studentTableBody');

let students: Student[] = [];

// --- Core Logic ---

/**
 * Saves the current application state to localStorage
 */
function saveState(): void {
  const state = {
    maxPoints: maxPointsInput?.value || '',
    rounding: getActiveRounding(),
    students: students,
    examTitle: examTitleInput?.value || '',
    examDate: examDateInput?.value || '',
    correctionDate: correctionDateInput?.value || ''
  };
  localStorage.setItem('bewertungsrechner_state', JSON.stringify(state));
}

const debouncedSaveState = debounce(saveState, 500);

/**
 * Loads the application state from localStorage
 */
function loadState(): void {
  const saved = localStorage.getItem('bewertungsrechner_state');
  
  try {
    if (saved) {
      const state = JSON.parse(saved);
      if (maxPointsInput && state.maxPoints !== undefined) {
        maxPointsInput.value = state.maxPoints;
        if (clearMaxPoints) clearMaxPoints.classList.toggle('hidden', !maxPointsInput.value);
      }
      if (state.rounding) {
        const radio = Array.from(roundingInputs).find(input => input.value === state.rounding);
        if (radio) radio.checked = true;
      }
      if (examTitleInput && state.examTitle) examTitleInput.value = state.examTitle;
      if (examDateInput && state.examDate) examDateInput.value = state.examDate;
      if (correctionDateInput && state.correctionDate) {
        correctionDateInput.value = state.correctionDate;
      } else if (correctionDateInput) {
        correctionDateInput.valueAsDate = new Date();
      }
      if (state.students) {
        students = state.students;
        updateStudentTable();
      }
    } else {
      // Default initial state if none exists
      if (correctionDateInput) correctionDateInput.valueAsDate = new Date();
    }
  } catch (e) {
    console.error("Failed to load state:", e);
  }
}

/**
 * Helper to map MSS points to traditional 1-6 grades
 */
function mssToGrade(mss: number): number {
  if (mss >= 13) return 1;
  if (mss >= 10) return 2;
  if (mss >= 7) return 3;
  if (mss >= 4) return 4;
  if (mss >= 1) return 5;
  return 6;
}

/**
 * Calculates and renders the average and distribution based on student results
 */
function calculateOverview(): void {
  if (!gradeCountDisplay || !averageDisplay || !distributionBar || !distributionLegend) return;

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

  students.forEach(student => {
    const pts = parseFloat(student.points.replace(',', '.'));
    if (!isNaN(pts)) {
      const mss = getMssForPoints(pts);
      const grade = mssToGrade(mss);
      totalGradeValue += grade;
      totalGrades += 1;
      distribution[grade] += 1;
    }
  });

  const averageGrade = totalGrades > 0 ? (totalGradeValue / totalGrades) : 0;
  
  // Update displays
  gradeCountDisplay.innerText = totalGrades.toString();
  averageDisplay.innerText = averageGrade.toFixed(2);

  // Render Graphical Distribution
  distributionLegend.replaceChildren();

  const maxCount = Math.max(...Object.values(distribution), 1);
  const chartWrappers = distributionBar.querySelectorAll('.group');

  Object.entries(distribution).forEach(([gradeStr, count], index) => {
    const grade = Number(gradeStr);
    const percentageOfMax = (count / maxCount) * 100;
    const wrapper = chartWrappers[index] as HTMLElement;
    
    if (wrapper) {
      const countLabel = wrapper.querySelector('.dist-count') as HTMLElement;
      const bar = wrapper.querySelector('.dist-bar') as HTMLElement;

      if (countLabel) {
        countLabel.innerText = count > 0 ? count.toString() : '';
      }

      if (bar) {
        bar.style.height = count > 0 ? `max(4px, ${percentageOfMax}%)` : '2px';
        bar.classList.toggle('opacity-10', count === 0);
      }
    }

    if (count > 0) {
      const legendItem = document.createElement('div');
      legendItem.className = "flex items-center space-x-1.5";
      legendItem.innerHTML = `
        <span class="w-2 h-2 rounded-full ${colors[grade]}"></span>
        <span>Note ${grade}: ${count}</span>
      `;
      distributionLegend.appendChild(legendItem);
    }
  });
}

/**
 * Finds the MSS points for a given score based on current thresholds
 */
function getMssForPoints(points: number): number {
  const max = parseFloat(maxPointsInput?.value.replace(',', '.') || '0');
  const mode = getActiveRounding();
  if (max === 0) return 0;
  
  for (const entry of MSS_SCALE) {
    const thresholdRaw = max * (entry.pct / 100);
    const thresholdRounded = calculatePoints(thresholdRaw, mode);
    if (points >= thresholdRounded) {
      return entry.mss;
    }
  }
  return 0;
}

/**
 * Renders the student table or updates existing rows
 */
function updateStudentTable(forceReRender: boolean = false): void {
  if (!studentTableBody) return;
  
  if (forceReRender || studentTableBody.children.length !== students.length) {
    studentTableBody.replaceChildren();

    students.forEach((student, index) => {
      const pts = parseFloat(student.points.replace(',', '.'));
      const mss = !isNaN(pts) ? getMssForPoints(pts) : null;
      
      const row = document.createElement('tr');
      row.className = "border-t border-slate-100 dark:border-neutral-900/50 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors";
      
      let mssDisplay = '—';
      let mssColor = "text-slate-300 dark:text-neutral-700";
      
      if (mss !== null) {
        mssDisplay = mss.toString().padStart(2, '0');
        if (mss >= 13) mssColor = "text-teal-600 dark:text-teal-400 font-bold";
        else if (mss < 5) mssColor = "text-red-600 dark:text-red-500";
        else mssColor = "text-slate-600 dark:text-neutral-400 font-bold";
      }

      row.innerHTML = `
        <td class="p-2 text-left font-medium text-slate-700 dark:text-neutral-300 text-sm">
          ${student.name}
        </td>
        <td class="p-2 text-center">
          <input 
            type="text" 
            inputmode="decimal"
            value="${student.points}" 
            class="w-16 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-neutral-800 rounded-lg p-1 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
            data-index="${index}"
          />
        </td>
        <td class="p-2 text-right font-black font-mono text-lg ${mssColor}">
          ${mssDisplay}
        </td>
      `;

      const input = row.querySelector('input') as HTMLInputElement;
      input?.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        students[index].points = target.value;
        updateStudentRow(index);
        calculateOverview();
        debouncedSaveState();
      });

      studentTableBody.appendChild(row);
    });
  } else {
    students.forEach((_, index) => updateStudentRow(index));
  }
}

/**
 * Updates a single row in the student table (to avoid focus loss)
 */
function updateStudentRow(index: number): void {
  const row = studentTableBody?.children[index];
  if (!row) return;

  const student = students[index];
  const pts = parseFloat(student.points.replace(',', '.'));
  const mss = !isNaN(pts) ? getMssForPoints(pts) : null;
  const mssCell = row.querySelector('td:last-child') as HTMLElement;

  if (mssCell) {
    let mssDisplay = '—';
    mssCell.className = "p-2 text-right font-black font-mono text-lg "; 
    
    if (mss !== null) {
      mssDisplay = mss.toString().padStart(2, '0');
      if (mss >= 13) mssCell.classList.add("text-teal-600", "dark:text-teal-400", "font-bold");
      else if (mss < 5) mssCell.classList.add("text-red-600", "dark:text-red-500");
      else mssCell.classList.add("text-slate-600", "dark:text-neutral-400", "font-bold");
    } else {
      mssCell.classList.add("text-slate-200", "dark:text-neutral-800");
    }
    mssCell.innerText = mssDisplay;
  }
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
    let mssColor = "text-slate-600 dark:text-neutral-400";
    let pointsColor = "text-slate-900 dark:text-white";
    let rowBg = "bg-transparent";
    
    if (entry.mss >= 13) {
      // High performance (13-15 MSS) - Teal
      mssColor = "text-teal-600 dark:text-teal-400 font-bold";
      if (max > 0) rowBg = "bg-teal-500/[0.03]";
    } else if (entry.mss < 5) {
      // Low performance (0-4 MSS) - Red
      mssColor = "text-red-600 dark:text-red-500";
      if (max > 0) rowBg = "bg-red-500/[0.03]";
    }

    // Percentage display logic (Target vs. Actual) with fixed height to prevent layout shift
    let pctDisplay = `
      <div class="flex flex-col items-center justify-center min-h-[40px]">
        <div class="font-bold text-xs text-slate-600 dark:text-neutral-300">${entry.pct}%</div>
        ${max > 0 ? `
          <div class="text-[8px] text-slate-500 dark:text-neutral-400 font-bold tracking-tight mt-1 uppercase">IST: ${effectivePct.toFixed(1)}%</div>
        ` : `
          <div class="text-[8px] mt-1 opacity-0">IST: 0.0%</div>
        `}
      </div>
    `;

    const row = document.createElement('tr');
    row.className = `${borderClass} ${rowBg} hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors`;
    row.innerHTML = `
      <td class="p-2 text-left font-bold font-mono text-lg ${mssColor}">
        ${entry.mss.toString().padStart(2, '0')}
      </td>
      <td class="p-2 text-center leading-tight">
        ${pctDisplay}
      </td>
      <td class="p-2 text-right font-black font-mono text-lg ${max > 0 ? pointsColor : 'text-slate-200 dark:text-neutral-800'}">
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

importStudentsBtn?.addEventListener('click', () => {
  importArea?.classList.remove('hidden');
  studentNamesInput?.focus();
});

cancelImport?.addEventListener('click', () => {
  importArea?.classList.add('hidden');
  if (studentNamesInput) studentNamesInput.value = '';
});

confirmImport?.addEventListener('click', () => {
  if (!studentNamesInput) return;
  const names = studentNamesInput.value.split('\n').map(n => n.trim()).filter(n => n !== '');
  
  const newStudents = names.map(name => ({ name, points: '' }));
  students = [...students, ...newStudents];
  
  studentNamesInput.value = '';
  importArea?.classList.add('hidden');
  updateStudentTable(true);
  calculateOverview();
  saveState();
});

exportCsvButton?.addEventListener('click', () => {
  const max = parseFloat(maxPointsInput?.value.replace(',', '.') || '0');
  const mode = getActiveRounding();
  
  // 1. Overview & Distribution
  let totalMssValue = 0;
  let totalCount = 0;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  
  students.forEach(s => {
    const pts = parseFloat(s.points.replace(',', '.'));
    if (!isNaN(pts)) {
      const mss = getMssForPoints(pts);
      const grade = mssToGrade(mss);
      totalMssValue += mss;
      totalCount++;
      distribution[grade]++;
    }
  });

  const averageMss = totalCount > 0 ? (totalMssValue / totalCount) : 0;

  let csv = '\ufeff'; // UTF-8 BOM for Excel
  csv += 'BEWERTUNG ÜBERSICHT\n';
  if (examTitleInput?.value) csv += `Bezeichnung;${examTitleInput.value}\n`;
  if (examDateInput?.value) csv += `Geschrieben am;${examDateInput.value}\n`;
  if (correctionDateInput?.value) csv += `Korrigiert am;${correctionDateInput.value}\n`;
  csv += `Maximale Punktzahl;${max}\n`;
  csv += `Rundungsmodus;${mode}\n`;
  csv += `Anzahl Schüler;${totalCount}\n`;
  csv += `MSS Durchschnitt;${averageMss.toFixed(2).replace('.', ',')}\n\n`;

  csv += 'NOTENVERTEILUNG\n';
  for (let g = 1; g <= 6; g++) {
    csv += `Note ${g};${distribution[g]}\n`;
  }
  csv += '\n';

  // 2. Threshold Table
  csv += 'PUNKTETABELLE\n';
  csv += 'MSS;Limit (%);Punkte\n';
  MSS_SCALE.forEach(entry => {
    const rawPoints = max * (entry.pct / 100);
    const roundedPoints = calculatePoints(rawPoints, mode);
    const formattedPoints = roundedPoints.toLocaleString('de-DE', {
      minimumFractionDigits: (mode === 'half' || mode === 'none') ? (mode === 'none' ? 2 : 1) : 0,
      maximumFractionDigits: 2
    });
    csv += `${entry.mss};${entry.pct}%;"${formattedPoints}"\n`;
  });
  csv += '\n';

  // 3. Student Results
  csv += 'SCHÜLER ERGEBNISSE\n';
  csv += 'Name;Erreicht;MSS;Note\n';
  students.forEach(s => {
    const pts = parseFloat(s.points.replace(',', '.'));
    const mss = !isNaN(pts) ? getMssForPoints(pts) : '';
    const grade = !isNaN(pts) ? mssToGrade(mss as number) : '';
    csv += `${s.name};${s.points};${mss};${grade}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const fileName = examTitleInput?.value 
    ? examTitleInput.value.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
    : `Bewertung_${new Date().toISOString().split('T')[0]}`;
    
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

csvImportInput?.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result as string;
    if (!text) return;

    const lines = text.split('\n');
    let isStudentSection = false;
    const newStudents: Student[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (trimmedLine.includes('SCHÜLER ERGEBNISSE')) {
        isStudentSection = true;
        return;
      }

      const parts = trimmedLine.split(';');
      if (parts.length < 2) return;

      const key = parts[0].replace(/^"|"$/g, '').trim();
      const value = parts[1].replace(/^"|"$/g, '').trim();

      if (!isStudentSection) {
        if (key === 'Bezeichnung' && examTitleInput) examTitleInput.value = value;
        else if (key === 'Geschrieben am' && examDateInput) examDateInput.value = value;
        else if (key === 'Korrigiert am' && correctionDateInput) correctionDateInput.value = value;
        else if (key === 'Maximale Punktzahl' && maxPointsInput) {
          maxPointsInput.value = value;
          if (clearMaxPoints) clearMaxPoints.classList.toggle('hidden', !value);
        }
        else if (key === 'Rundungsmodus') {
          const radio = Array.from(roundingInputs).find(input => input.value === value);
          if (radio) radio.checked = true;
        }
      } else {
        // We are in student section. Skip the header row "Name;Erreicht;..."
        if (key === 'Name') return;
        newStudents.push({ name: key, points: value });
      }
    });

    if (newStudents.length > 0) {
      students = newStudents;
      updateTable();
      updateStudentTable(true);
      calculateOverview();
      saveState();
      alert('Daten erfolgreich importiert!');
    }
    
    // Reset file input
    if (csvImportInput) csvImportInput.value = '';
  };
  reader.readAsText(file);
});

maxPointsInput?.addEventListener('input', () => {
  if (clearMaxPoints) {
    clearMaxPoints.classList.toggle('hidden', !maxPointsInput.value);
  }
  updateTable();
  updateStudentTable();
  calculateOverview();
  debouncedSaveState();
});

examTitleInput?.addEventListener('input', () => debouncedSaveState());
examDateInput?.addEventListener('change', saveState);
correctionDateInput?.addEventListener('change', saveState);

presetButtons.forEach(btn => btn.addEventListener('click', () => {
  if (maxPointsInput) {
    maxPointsInput.value = btn.dataset.value || '';
    if (clearMaxPoints) clearMaxPoints.classList.remove('hidden');
    updateTable();
    updateStudentTable();
    calculateOverview();
    saveState();
  }
}));

clearMaxPoints?.addEventListener('click', () => {
  if (maxPointsInput) {
    maxPointsInput.value = '';
    clearMaxPoints.classList.add('hidden');
    updateTable();
    updateStudentTable();
    calculateOverview();
    saveState();
    maxPointsInput.focus();
  }
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
  updateStudentTable();
  calculateOverview();
  saveState();
}));

copyTableButton?.addEventListener('click', async () => {
  const max = parseFloat(maxPointsInput?.value.replace(',', '.') || '0');
  if (!max) return;

  const mode = getActiveRounding();
  let markdown = `MSS Notenrechner | Max: ${max} Punkte | Rundung: ${mode}\n\n`;
  markdown += `| MSS | Limit | Punkte |\n`;
  markdown += `| :-- | :---: | -----: |\n`;

  MSS_SCALE.forEach(entry => {
    const rawPoints = max * (entry.pct / 100);
    const roundedPoints = calculatePoints(rawPoints, mode);
    const formattedPoints = roundedPoints.toLocaleString('de-DE', {
      minimumFractionDigits: (mode === 'half' || mode === 'none') ? (mode === 'none' ? 2 : 1) : 0,
      maximumFractionDigits: 2
    });
    markdown += `| ${entry.mss.toString().padStart(2, '0')} | ${entry.pct}% | ${formattedPoints} |\n`;
  });

  try {
    await navigator.clipboard.writeText(markdown);
    const originalContent = copyTableButton.innerHTML;
    copyTableButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-teal-500"><path d="M20 6 9 17l-5-5"/></svg>
      Kopiert!
    `;
    setTimeout(() => {
      copyTableButton.innerHTML = originalContent;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy table:', err);
  }
});

resetGradesButton?.addEventListener('click', () => {
  if (confirm('Wirklich alles löschen (Titel, Punkte, Schüler)?')) {
    // Reset inputs
    if (examTitleInput) examTitleInput.value = '';
    if (examDateInput) examDateInput.value = '';
    if (correctionDateInput) correctionDateInput.valueAsDate = new Date();
    if (maxPointsInput) {
      maxPointsInput.value = '';
      if (clearMaxPoints) clearMaxPoints.classList.add('hidden');
    }
    
    // Reset rounding to default (down)
    const downRadio = Array.from(roundingInputs).find(input => input.value === 'down');
    if (downRadio) downRadio.checked = true;

    // Reset students
    students = [];
    
    updateTable();
    updateStudentTable();
    calculateOverview();
    saveState();
  }
});

// --- Lifecycle ---

/**
 * Highlight nav links based on scroll position
 */
function initSectionObserver(): void {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateTable();
    updateStudentTable();
    calculateOverview();
    initSectionObserver();
  });
} else {
  loadState();
  updateTable();
  updateStudentTable();
  calculateOverview();
  initSectionObserver();
}

// Service Worker Registration (Non-blocking)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}
