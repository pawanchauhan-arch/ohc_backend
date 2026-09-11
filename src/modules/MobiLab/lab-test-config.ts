// 1. Define Table Names (Matches your SQL Schema)
export enum LabTable {
  CBC = 'cbc',
  BIOCHEMISTRY = 'biochemistry',
  LIPID_PROFILE = 'lipid_profile',
  KFT = 'kft',
  LFT = 'lft',
}

export interface TestMapping {
  targetTable: LabTable;
  targetColumn: string;
}

/** mobilab_tests section key → lab table */
export const MOBILAB_SECTION_TABLE: Record<string, LabTable> = {
  cbc: LabTable.CBC,
  biochemistry: LabTable.BIOCHEMISTRY,
  lipid: LabTable.LIPID_PROFILE,
  lipid_profile: LabTable.LIPID_PROFILE,
  kft: LabTable.KFT,
  lft: LabTable.LFT,
};

/** Allow FE to send PostgreSQL column names directly under mobilab_tests.{section} */
export const TABLE_DB_COLUMNS: Record<LabTable, ReadonlySet<string>> = {
  [LabTable.CBC]: new Set([
    'haemoglobin',
    'packed_cell_volume',
    'rbc_count',
    'mcv',
    'mch',
    'mchc',
    'rdw_cv',
    'rdw_sd',
    'total_leucocyte_count',
    'neutrophils',
    'lymphocytes',
    'monocytes',
    'eosinophils',
    'basophils',
    'mixed_cells_percent',
    'abs_neutrophil_count',
    'abs_lymphocyte_count',
    'abs_monocyte_count',
    'abs_eosinophil_count',
    'abs_basophil_count',
    'abs_mixed_cells_count',
    'platelet_count',
    'mpv',
    'pdw',
    'pct',
    'p_lcr',
    'p_lcc',
    'plr',
    'nlr',
  ]),
  [LabTable.BIOCHEMISTRY]: new Set(['glucose', 'hba1c']),
  [LabTable.LIPID_PROFILE]: new Set([
    'cholesterol',
    'triglycerides',
    'ldl_cholesterol',
    'hdl_cholesterol',
    'vldl_cholesterol',
  ]),
  [LabTable.KFT]: new Set(['urea', 'uric_acid', 'creatinine']),
  [LabTable.LFT]: new Set([
    'albumin',
    'total_protein',
    'bilirubin_total',
    'sgot',
    'sgpt',
    'globulin',
    'ag_ratio',
    'bilirubin_direct',
    'bilirubin_indirect',
    'ast_alt_ratio',
    'alkaline_phosphatase',
    'ggtp',
  ]),
};

// 2. The Source of Truth
// Keys are normalized (lowercased) to ensure matching works even if casing changes.
export const LAB_TEST_MAP: Record<string, TestMapping> = {
  
  // --- ID: 3 | Glucose ---
  'glucose': { targetTable: LabTable.BIOCHEMISTRY, targetColumn: 'glucose' },

  // --- ID: 39 | HbA1C ---
  'hba1c': { targetTable: LabTable.BIOCHEMISTRY, targetColumn: 'hba1c' },

  // --- ID: 17 | Haemoglobin ---
  'haemoglobin': { targetTable: LabTable.CBC, targetColumn: 'haemoglobin' },
  'hemoglobin': { targetTable: LabTable.CBC, targetColumn: 'haemoglobin' },
  'hgb': { targetTable: LabTable.CBC, targetColumn: 'haemoglobin' },
  'cbc': { targetTable: LabTable.CBC, targetColumn: 'haemoglobin' },

  // --- ID: 42 | CBC ---
  // Note: CBC is usually a group. If a result comes with name "CBC", 
  // we map it to 'haemoglobin' or a summary column if you have one.
  'wbc': { targetTable: LabTable.CBC, targetColumn: 'total_leucocyte_count' },
  'tlc': { targetTable: LabTable.CBC, targetColumn: 'total_leucocyte_count' },
  'total leucocyte count': { targetTable: LabTable.CBC, targetColumn: 'total_leucocyte_count' },
  'total leukocyte count': { targetTable: LabTable.CBC, targetColumn: 'total_leucocyte_count' },

  // --- Red Blood Cells ---
  'rbc': { targetTable: LabTable.CBC, targetColumn: 'rbc_count' },
  'rbc count': { targetTable: LabTable.CBC, targetColumn: 'rbc_count' },
  
  'hct': { targetTable: LabTable.CBC, targetColumn: 'packed_cell_volume' },
  'packed cell volume': { targetTable: LabTable.CBC, targetColumn: 'packed_cell_volume' },
  'pcv': { targetTable: LabTable.CBC, targetColumn: 'packed_cell_volume' },

  // --- Indices ---
  'mcv': { targetTable: LabTable.CBC, targetColumn: 'mcv' },
  'mch': { targetTable: LabTable.CBC, targetColumn: 'mch' },
  'mchc': { targetTable: LabTable.CBC, targetColumn: 'mchc' },

  // --- RDW (Width) ---
  'rdw_cv': { targetTable: LabTable.CBC, targetColumn: 'rdw_cv' },
  'rdw cv': { targetTable: LabTable.CBC, targetColumn: 'rdw_cv' },
  'rdw-cv': { targetTable: LabTable.CBC, targetColumn: 'rdw_cv' },
  'rdw': { targetTable: LabTable.CBC, targetColumn: 'rdw_cv' }, // Generic RDW usually maps to CV
  'rdw_sd': { targetTable: LabTable.CBC, targetColumn: 'rdw_sd' },
  'rdw sd': { targetTable: LabTable.CBC, targetColumn: 'rdw_sd' },
  'rdw-sd': { targetTable: LabTable.CBC, targetColumn: 'rdw_sd' },

  // --- Differential Count (Percentages %) ---
  'neut%': { targetTable: LabTable.CBC, targetColumn: 'neutrophils' },
  'neut %': { targetTable: LabTable.CBC, targetColumn: 'neutrophils' },
  'neutrophils': { targetTable: LabTable.CBC, targetColumn: 'neutrophils' },
  
  'lym%': { targetTable: LabTable.CBC, targetColumn: 'lymphocytes' },
  'lym %': { targetTable: LabTable.CBC, targetColumn: 'lymphocytes' },
  'lymphocytes': { targetTable: LabTable.CBC, targetColumn: 'lymphocytes' },

  'mono%': { targetTable: LabTable.CBC, targetColumn: 'monocytes' },
  'mono %': { targetTable: LabTable.CBC, targetColumn: 'monocytes' },
  'monocytes': { targetTable: LabTable.CBC, targetColumn: 'monocytes' },

  'eos%': { targetTable: LabTable.CBC, targetColumn: 'eosinophils' },
  'eos %': { targetTable: LabTable.CBC, targetColumn: 'eosinophils' },
  'eosinophils': { targetTable: LabTable.CBC, targetColumn: 'eosinophils' },

  'baso%': { targetTable: LabTable.CBC, targetColumn: 'basophils' },
  'baso %': { targetTable: LabTable.CBC, targetColumn: 'basophils' },
  'basophils': { targetTable: LabTable.CBC, targetColumn: 'basophils' },

  'mxd%': { targetTable: LabTable.CBC, targetColumn: 'mixed_cells_percent' },
  'mxd %': { targetTable: LabTable.CBC, targetColumn: 'mixed_cells_percent' },

  // --- Differential Count (Absolute Numbers #) ---
  'neut#': { targetTable: LabTable.CBC, targetColumn: 'abs_neutrophil_count' },
  'neut #': { targetTable: LabTable.CBC, targetColumn: 'abs_neutrophil_count' },
  'neut hash': { targetTable: LabTable.CBC, targetColumn: 'abs_neutrophil_count' },
  'absolute neutrophil count': { targetTable: LabTable.CBC, targetColumn: 'abs_neutrophil_count' },

  'neut percent': { targetTable: LabTable.CBC, targetColumn: 'neutrophils' },

  'lym#': { targetTable: LabTable.CBC, targetColumn: 'abs_lymphocyte_count' },
  'lym #': { targetTable: LabTable.CBC, targetColumn: 'abs_lymphocyte_count' },
  'lym hash': { targetTable: LabTable.CBC, targetColumn: 'abs_lymphocyte_count' },
  'absolute lymphocyte count': { targetTable: LabTable.CBC, targetColumn: 'abs_lymphocyte_count' },

  'lym percent': { targetTable: LabTable.CBC, targetColumn: 'lymphocytes' },

  'mono#': { targetTable: LabTable.CBC, targetColumn: 'abs_monocyte_count' },
  'mono #': { targetTable: LabTable.CBC, targetColumn: 'abs_monocyte_count' },
  'absolute monocyte count': { targetTable: LabTable.CBC, targetColumn: 'abs_monocyte_count' },

  'eos#': { targetTable: LabTable.CBC, targetColumn: 'abs_eosinophil_count' },
  'eos #': { targetTable: LabTable.CBC, targetColumn: 'abs_eosinophil_count' },
  'absolute eosinophil count': { targetTable: LabTable.CBC, targetColumn: 'abs_eosinophil_count' },

  'baso#': { targetTable: LabTable.CBC, targetColumn: 'abs_basophil_count' },
  'baso #': { targetTable: LabTable.CBC, targetColumn: 'abs_basophil_count' },
  'mxd#': { targetTable: LabTable.CBC, targetColumn: 'abs_mixed_cells_count' },
  'mxd #': { targetTable: LabTable.CBC, targetColumn: 'abs_mixed_cells_count' },
  'mxd hash': { targetTable: LabTable.CBC, targetColumn: 'abs_mixed_cells_count' },
  'mxd percent': { targetTable: LabTable.CBC, targetColumn: 'mixed_cells_percent' },
  'mixed cells percent': { targetTable: LabTable.CBC, targetColumn: 'mixed_cells_percent' },

  'abs neutrophil count': { targetTable: LabTable.CBC, targetColumn: 'abs_neutrophil_count' },
  'abs lymphocyte count': { targetTable: LabTable.CBC, targetColumn: 'abs_lymphocyte_count' },
  'abs monocyte count': { targetTable: LabTable.CBC, targetColumn: 'abs_monocyte_count' },
  'abs eosinophil count': { targetTable: LabTable.CBC, targetColumn: 'abs_eosinophil_count' },
  'abs basophil count': { targetTable: LabTable.CBC, targetColumn: 'abs_basophil_count' },
  'abs mixed cells count': { targetTable: LabTable.CBC, targetColumn: 'abs_mixed_cells_count' },

  // --- Platelets ---
  'plt': { targetTable: LabTable.CBC, targetColumn: 'platelet_count' },
  'platelet count': { targetTable: LabTable.CBC, targetColumn: 'platelet_count' },
  
  'mpv': { targetTable: LabTable.CBC, targetColumn: 'mpv' },
  'pdw': { targetTable: LabTable.CBC, targetColumn: 'pdw' },
  'pct': { targetTable: LabTable.CBC, targetColumn: 'pct' },
  'p_lcr': { targetTable: LabTable.CBC, targetColumn: 'p_lcr' },
  'p lcr': { targetTable: LabTable.CBC, targetColumn: 'p_lcr' },
  'p-lcr': { targetTable: LabTable.CBC, targetColumn: 'p_lcr' },
  'p_lcc': { targetTable: LabTable.CBC, targetColumn: 'p_lcc' },
  'p lcc': { targetTable: LabTable.CBC, targetColumn: 'p_lcc' },
  'p-lcc': { targetTable: LabTable.CBC, targetColumn: 'p_lcc' },

  // --- Ratios ---
  'nlr': { targetTable: LabTable.CBC, targetColumn: 'nlr' },
  'plr': { targetTable: LabTable.CBC, targetColumn: 'plr' },
  

  // --- LIPID PROFILE (IDs: 7, 8, 10) ---
  'ldl': { targetTable: LabTable.LIPID_PROFILE, targetColumn: 'ldl_cholesterol' },       // ID: 10
  'cholesterol': { targetTable: LabTable.LIPID_PROFILE, targetColumn: 'cholesterol' },   // ID: 8
  'triglyceride': { targetTable: LabTable.LIPID_PROFILE, targetColumn: 'triglycerides' },// ID: 7
  'triglycerides': { targetTable: LabTable.LIPID_PROFILE, targetColumn: 'triglycerides' },

  // --- LIVER PROFILE (LFT) (IDs: 1, 12, 23, 24, 25) ---
  'albumin': { targetTable: LabTable.LFT, targetColumn: 'albumin' },                     // ID: 1
  'total_protein': { targetTable: LabTable.LFT, targetColumn: 'total_protein' },         // ID: 12
  'total protein': { targetTable: LabTable.LFT, targetColumn: 'total_protein' },         // Alias (Space vs Underscore)
  'bilirubin_total': { targetTable: LabTable.LFT, targetColumn: 'bilirubin_total' },     // ID: 23
  'bilirubin total': { targetTable: LabTable.LFT, targetColumn: 'bilirubin_total' },     // Alias
  'sgot': { targetTable: LabTable.LFT, targetColumn: 'sgot' },                           // ID: 24
  'sgpt': { targetTable: LabTable.LFT, targetColumn: 'sgpt' },                           // ID: 25

  // --- KIDNEY PROFILE (KFT) (IDs: 6, 16, 20) ---
  'urea': { targetTable: LabTable.KFT, targetColumn: 'urea' },                           // ID: 6
  'uric_acid': { targetTable: LabTable.KFT, targetColumn: 'uric_acid' },                 // ID: 16
  'uric acid': { targetTable: LabTable.KFT, targetColumn: 'uric_acid' },                 // Alias
  'creatinine': { targetTable: LabTable.KFT, targetColumn: 'creatinine' },               // ID: 20
};

/**
 * Resolve vendor/spreadsheet/FE key to table + column.
 * @param sectionKey mobilab_tests section (e.g. "cbc") when syncing selected_test
 */
export function resolveLabTestMapping(
  rawKey: string,
  sectionKey?: string,
): TestMapping | undefined {
  const trimmed = rawKey.trim();
  if (!trimmed) return undefined;

  const columnCandidate = trimmed.toLowerCase();

  if (sectionKey) {
    const table = MOBILAB_SECTION_TABLE[sectionKey.toLowerCase()];
    if (table && TABLE_DB_COLUMNS[table]?.has(columnCandidate)) {
      return { targetTable: table, targetColumn: columnCandidate };
    }
  }

  const normalized = columnCandidate
    .replace(/[_-]/g, ' ')
    .replace(/\s*([#%])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return LAB_TEST_MAP[normalized] ?? LAB_TEST_MAP[columnCandidate];
}