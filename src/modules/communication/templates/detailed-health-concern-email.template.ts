const UNFIT_REFERRED_HIGHER_CENTER = 'UNFIT AND REFERRED FOR HIGHER CENTER';
const FIT_WITH_MEDICATION = 'FIT WITH MEDICATION';

type ConcernEmailNarrativeMode =
  | 'doctor_medication'
  | 'doctor_referred'
  | 'doctor_unavailable_high'
  | 'doctor_unavailable_moderate';

export interface DetailedHealthEmailTemplateContext {
  checkupFitnessStatus: string | null;
  prescriptionFitnessStatus: string | null;
  referenceDate?: Date | string | null;
}

export interface DetailedHealthEmailTemplateData {
  driverName: string;
  vehicleNo: string;
  dlNo: string;
  driverContact: string;
  centreName: string;
  testParameter: string;
  concernLevel: string;
  concernLevelRange: string;
  levelTested: string;
  recommendation: string;
  supervisorName: string;
  supervisorContact: string;
  testUnit?: string;
}

type RangeTableLayout = 'horizontal' | 'vertical';

interface ParameterColumn {
  label: string;
  value: string;
  class: string;
}

interface ParameterConfig {
  rangeTitle: string;
  columns: ParameterColumn[];
  layout?: RangeTableLayout;
  valueColumnLabel?: string;
}

function resolveColumnInlineStyle(cssClass: string): string {
  if (cssClass === 'bg-high') {
    return 'background-color: #C00000; color: white;';
  }
  if (cssClass === 'bg-mod') {
    return 'background-color: #ED7D31; color: black;';
  }
  if (cssClass === 'bg-border') {
    return 'background-color: #FFC000; color: black;';
  }
  if (cssClass === 'bg-norm') {
    return 'background-color: #92D050; color: black;';
  }
  return 'background-color: #FFFFFF; color: black;';
}

function buildRangeTableHtml(paramConfig: ParameterConfig): string {
  const layout = paramConfig.layout ?? 'horizontal';
  if (layout === 'vertical') {
    const valueColumnLabel = paramConfig.valueColumnLabel ?? 'Range';
    const rowsHtml = paramConfig.columns
      .map((col) => {
        const cellStyle = resolveColumnInlineStyle(col.class);
        return `
          <tr>
            <td style="${cellStyle} border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${col.label}</td>
            <td style="${cellStyle} border: 1px solid #000; padding: 6px; text-align: center;">${col.value}</td>
          </tr>
        `;
      })
      .join('');
    return `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
        <thead>
          <tr style="background-color: #B4C6E7;">
            <th style="border: 1px solid #000; padding: 6px; text-align: center;">Concern Level</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: center;">${valueColumnLabel}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }
  const headerCells = paramConfig.columns
    .map((col) => {
      const cellStyle = resolveColumnInlineStyle(col.class);
      return `<th style="${cellStyle} border: 1px solid #000; padding: 6px; text-align: center;">${col.label}</th>`;
    })
    .join('');
  const valueCells = paramConfig.columns
    .map((col) => {
      const cellStyle = resolveColumnInlineStyle(col.class);
      return `<td style="${cellStyle} border: 1px solid #000; padding: 6px; text-align: center;">${col.value}</td>`;
    })
    .join('');
  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
      <tr>
        ${headerCells}
      </tr>
      <tr>
        ${valueCells}
      </tr>
    </table>
  `;
}

function isDoctorUnavailable(referenceDate?: Date | string | null): boolean {
  const dateValue = referenceDate ? new Date(referenceDate) : new Date();
  if (Number.isNaN(dateValue.getTime())) {
    return false;
  }
  const utcMinutes = dateValue.getUTCHours() * 60 + dateValue.getUTCMinutes();
  const istMinutes = (utcMinutes + 330) % (24 * 60);
  return istMinutes >= 30 && istMinutes < 570;
}

function resolveConcernEmailNarrativeMode(
  concernLevel: string,
  ctx?: DetailedHealthEmailTemplateContext,
): ConcernEmailNarrativeMode {
  const isHigh = concernLevel.toLowerCase().includes('high');
  const doctorUnavailable = isDoctorUnavailable(ctx?.referenceDate);
  if (doctorUnavailable) {
    return isHigh ? 'doctor_unavailable_high' : 'doctor_unavailable_moderate';
  }

  const effectiveFitnessStatus =
    ctx?.prescriptionFitnessStatus ?? ctx?.checkupFitnessStatus ?? null;
  if (effectiveFitnessStatus === FIT_WITH_MEDICATION) {
    return 'doctor_medication';
  }
  if (effectiveFitnessStatus === UNFIT_REFERRED_HIGHER_CENTER) {
    return 'doctor_referred';
  }
  return isHigh ? 'doctor_referred' : 'doctor_medication';
}

function extractUnitFromConcernLevelRange(range: string): string | null {
  const text = (range ?? '').trim();
  if (!text) {
    return null;
  }
  const match = text.match(/([a-zA-Z%°\/^]+(?:\s?[a-zA-Z%°\/^]+)?)$/);
  return match?.[1]?.trim() || null;
}

function hasEmbeddedUnit(value: string): boolean {
  return /[a-zA-Z%°]/.test(value);
}

function isVisionTestParameter(testParameter: string): boolean {
  const paramKey = testParameter.replace(/[\s-]/g, '').toUpperCase();
  return paramKey === 'VISION' || paramKey === 'EYEVISION' || paramKey === 'EYE_VISION';
}

function formatConcernLevelRangeForEmail(
  data: DetailedHealthEmailTemplateData,
): string {
  if (!isVisionTestParameter(data.testParameter)) {
    return data.concernLevelRange;
  }
  const isHigh = data.concernLevel.toLowerCase().includes('high');
  return isHigh ? 'L:- >6/9 , R:- >6/9' : 'L- 6/9, R-6/9';
}

function formatConcernEmailTestedValueWithUnit(
  data: DetailedHealthEmailTemplateData,
): string {
  const rawValue = (data.levelTested ?? '').trim();
  if (!rawValue) {
    return 'N/A';
  }
  if (hasEmbeddedUnit(rawValue)) {
    return rawValue;
  }
  const unit =
    (data.testUnit ?? '').trim() ||
    extractUnitFromConcernLevelRange(data.concernLevelRange) ||
    '';
  return unit ? `${rawValue} ${unit}` : rawValue;
}

function buildNarrativeHtml(
  data: DetailedHealthEmailTemplateData,
  mode: ConcernEmailNarrativeMode,
  testedValueWithUnit: string,
): string {
  const commonClosing = `<p>We appreciate your prompt attention to this matter and your cooperation in ensuring his health and safety.</p>`;
  if (mode === 'doctor_medication') {
    return `
      <p>This is to bring to your attention that, during our medical assessment <strong>Mr. ${data.driverName}</strong> was diagnosed with <strong>${data.testParameter}</strong> and subsequently received a consultation with a doctor. During screening his ${data.testParameter} level was found <strong>${testedValueWithUnit}</strong>.</p>
      <p>Based on the doctor's medical advice, the prescribed medication should be taken and all instructions must be followed. Additionally, the Supervisor/Safety Officer, <strong>Mr. ${data.supervisorName}</strong> <strong>(Mob No. ${data.supervisorContact})</strong>, has been informed at our Kavach Centre for further necessary action.</p>
      <p>At our Kavach Centres, we have been providing regular counselling to all the drivers in need to support their well-being and ensure health and safety. Hence, we urge you to ensure that <strong>Mr. ${data.driverName}</strong> adheres to the prescribed treatment and follows the doctor's recommendations.</p>
      ${commonClosing}
    `;
  }
  if (mode === 'doctor_referred') {
    return `
      <p>This is to bring to your attention that, during our medical assessment <strong>Mr. ${data.driverName}</strong> was diagnosed with <strong>${data.testParameter}</strong> and subsequently received a consultation with a doctor. During screening his ${data.testParameter} level was found <strong>${testedValueWithUnit}</strong>.</p>
      <p>Based on the medical advice by the doctor, he has been referred to higher centre. Furthermore, we have also intimated the Supervisor/Safety Officer, <strong>Mr. ${data.supervisorName}</strong> <strong>(Mob No.-${data.supervisorContact})</strong> at our Kavach Centre for further necessary action.</p>
      <p>At our Kavach Centres, we have been providing regular counselling to all the drivers in need to support their well-being and ensure health and safety. Hence, we urge you to ensure that <strong>Mr. ${data.driverName}</strong> adheres to the prescribed treatment and follows the doctor's recommendations.</p>
      ${commonClosing}
    `;
  }
  if (mode === 'doctor_unavailable_high') {
    return `
      <p>This is to bring to your attention that, during our medical assessment <strong>Mr. ${data.driverName}</strong> was diagnosed with <strong>${data.testParameter}</strong> and during screening his ${data.testParameter} level was found <strong>${testedValueWithUnit}</strong>.</p>
      <p>Based on the test results, the driver's health report is in high concern zone and is referred to higher facility and we recommend that he undergo consultation at the earliest or during his next visit to the centre. Additionally, the supervisor, <strong>Mr. ${data.supervisorName}</strong> Supervisor/Safety Officer, <strong>(Mob No. ${data.supervisorContact})</strong>, has been informed at our Kavach Centre for further necessary action.</p>
      <p>At our Kavach Centres, we have been providing regular counselling to all the drivers in need to support their well-being and ensure health and safety. Hence, we urge you to ensure that <strong>Mr. ${data.driverName}</strong> follows the advice.</p>
      ${commonClosing}
    `;
  }
  return `
    <p>This is to bring to your attention that, during our medical assessment <strong>Mr. ${data.driverName}</strong> was diagnosed with <strong>${data.testParameter}</strong> and during screening his ${data.testParameter} level was found <strong>${testedValueWithUnit}</strong>.</p>
    <p>Based on the test results, the driver's health report is in moderate concern zone and we recommend that he undergo consultation at the earliest or during his next visit to the centre. Additionally, the supervisor, <strong>Mr. ${data.supervisorName}</strong> Supervisor/Safety Officer, <strong>(Mob No. ${data.supervisorContact})</strong>, has been informed at our Kavach Centre for further necessary action.</p>
    <p>At our Kavach Centres, we have been providing regular counselling to all the drivers in need to support their well-being and ensure health and safety. Hence, we urge you to ensure that <strong>Mr. ${data.driverName}</strong> follows the advice.</p>
    ${commonClosing}
  `;
}

export function buildDetailedHealthConcernEmailTemplate(
  data: DetailedHealthEmailTemplateData,
  ctx?: DetailedHealthEmailTemplateContext,
): string {
  const isHigh = data.concernLevel.toLowerCase().includes('high');
  const colors = isHigh
    ? { bg: '#C00000' }
    : { bg: '#ED7D31' };
  const paramConfig = getParameterConfig(data.testParameter);
  const mode = resolveConcernEmailNarrativeMode(data.concernLevel, ctx);
  const concernLevelRange = formatConcernLevelRangeForEmail(data);
  const testedValueWithUnit = formatConcernEmailTestedValueWithUnit({
    ...data,
    concernLevelRange,
  });
  const narrativeHtml = buildNarrativeHtml(data, mode, testedValueWithUnit);

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Calibri', Arial, sans-serif; font-size: 14px; color: #000; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle; }
          .bg-high { background-color: #C00000; color: white; }
          .bg-mod { background-color: #ED7D31; }
          .bg-border { background-color: #FFC000; }
          .bg-norm { background-color: #92D050; }
          .section-title { text-decoration: underline; font-weight: bold; margin-top: 20px; display: block; text-transform: uppercase; }
          .footer-table { border: none !important; }
          .footer-table td { border: none !important; text-align: left; vertical-align: top; }
          .lmc-text { color: #008080; font-size: 24px; font-weight: bold; }
          .divider { border-top: 2px solid #008080; margin: 10px 0; }
        </style>
      </head>
      <body>
        <p><strong>Dear Sir,</strong></p>
        <p>I am writing to bring to your attention a health concern regarding your driver <strong>Mr. ${data.driverName}</strong>, Details as below:</p>
        <div style="margin-bottom: 20px; line-height: 1.6;">
          <strong>Name-</strong> Mr. ${data.driverName}<br>
          <strong>Vehicle No:</strong> ${data.vehicleNo}<br>
          <strong>DL No.-</strong> ${data.dlNo}<br>
          <strong>Driver Contact:</strong> ${data.driverContact}<br>
          <strong>Centre:</strong> ${data.centreName}
        </div>
        <table>
          <thead>
            <tr style="background-color: #B4C6E7;">
              <th>Test Parameter</th>
              <th>Concern Level</th>
              <th>Concern Level Range</th>
              <th>Level Tested</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="background-color: #DAE3F3;"><strong>${data.testParameter}</strong></td>
              <td style="background-color: ${colors.bg}; color: ${isHigh ? 'white' : 'black'};"><strong>${data.concernLevel}</strong></td>
              <td style="background-color: ${colors.bg}; color: ${isHigh ? 'white' : 'black'};"><strong>${concernLevelRange}</strong></td>
              <td style="background-color: ${colors.bg}; color: ${isHigh ? 'white' : 'black'};"><strong>${testedValueWithUnit}</strong></td>
              <td style="background-color: ${colors.bg}; color: ${isHigh ? 'white' : 'black'};"><strong>${data.recommendation}</strong></td>
            </tr>
          </tbody>
        </table>

        ${narrativeHtml}

        <br>
        <span class="section-title">${paramConfig.rangeTitle}</span>
        <br>
        ${buildRangeTableHtml(paramConfig)}
        <table>
          <thead>
            <tr style="background-color: #DEEBF7;">
              <th width="15%">Concern Level</th>
              <th width="20%">Action taken</th>
              <th>Action/Escalation</th>
            </tr>
          </thead>
          <tbody>
            ${getActionTableRows(isHigh, colors.bg)}
          </tbody>
        </table>
        <br><br>
        ${getSignatureFooter()}
      </body>
      </html>
    `;
}

function getActionTableRows(isHigh: boolean, colorCode: string): string {
  const textColor = isHigh ? 'white' : 'black';
  if (isHigh) {
    return `
      <tr>
        <td style="background-color: ${colorCode}; color: ${textColor}; font-weight: bold;">High Concern</td>
        <td style="background-color: ${colorCode}; color: ${textColor};">Tele-Consultation</td>
        <td style="text-align: left; background-color: ${colorCode}; color: ${textColor}; padding: 10px;">
          <ol style="margin: 0; padding-left: 20px;">
            <li><strong>Doctor Consultation & Immediate Referral</strong> – Arrange mandatory doctor consultation and facilitate urgent referrals as advised through Transporter’s SPOC</li>
            <li><strong>Inform Transporter SPOC</strong> – Notify via phone call and email with clear next steps.</li>
            <li><strong>Provide Health Records</strong> – Share all previous health records with a concerned person/doctor for timely action.</li>
            <li><strong>Supervisor Coordination</strong> – Ensure the supervisor reports to the Kavach Centre for follow-through.</li>
          </ol>
        </td>
      </tr>
    `;
  }
  return `
    <tr>
      <td style="background-color: ${colorCode}; font-weight: bold;">Moderate Concern</td>
      <td style="background-color: ${colorCode}; font-weight: bold;">Tele-Consultation</td>
      <td style="text-align: left; background-color: ${colorCode};">
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Doctor Consultation (Mandatory)</strong> – Facilitate Doctor Consultation & follow advice.</li>
          <li><strong>Medication & Further Investigations</strong> – Must be ensured for accurate diagnosis.</li>
          <li><strong>Lifestyle Counselling</strong> – Guide on diet, exercise, stress, and habit change for better health.</li>
          <li><strong>Pamphlet</strong> – Distribute pamphlet with health tips with disease-prevention info and self care tipsli>
          <li><strong>Inform Transporter SPOC</strong> – Connect via phone & Email and ensure need of medication & Further Investigations is communicated.</li>
        </ul>
      </td>
    </tr>
  `;
}

function getSignatureFooter(): string {
  return `
    <div style="font-family: Arial, sans-serif;">
      <p style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">With Best Regards,</p>
      <table class="footer-table" style="width: 100%; border: none;">
        <tr>
          <td style="width: 40%; vertical-align: middle;">
            <span class="lmc-text">Team LMC</span>
          </td>
          <td style="width: 60%; text-align: right; vertical-align: middle;">
            <img src="https://mediaandfiles.s3.amazonaws.com/uploads/1771324218657-Last-Mile-Care_logo.jpg" alt="Last Mile Care" style="height: 50px; margin-right: 15px;">
            <img src="https://mediaandfiles.s3.amazonaws.com/uploads/1771324299711-kavach.png" alt="Kavach" style="height: 50px;">
          </td>
        </tr>
      </table>
      <div class="divider"></div>
      <div style="font-size: 13px; color: #000; line-height: 1.4;">
        <strong>Mobile:</strong> +91-8092102102<br>
        <strong>Head Office-</strong> 3rd Floor Landmark Cyberpark, Sector 67, Gurugram, 122102<br>
        <strong>Branch Office-</strong> Plot No 56, Bukru, Ranchi, Jharkhand-834006
      </div>
      <table class="footer-table" style="width: 100%; margin-top: 15px;">
        <tr>
          <td style="vertical-align: middle;">
            <a href="http://www.lastmilecare.in" style="color: #008080; font-weight: bold; text-decoration: underline;">www.lastmilecare.in</a>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <a href="https://www.linkedin.com/company/last-mile-care-pvt-ltd" style="text-decoration: none; margin-left: 5px;">
              <img src="https://cdn-icons-png.flaticon.com/512/1384/1384088.png" alt="LinkedIn" width="24">
            </a>
            <a href="https://www.facebook.com/1careclinics" style="text-decoration: none; margin-left: 5px;">
              <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="FB" width="24">
            </a>
            <a href="https://www.instagram.com/lastmilecare" style="text-decoration: none; margin-left: 5px;">
              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="IG" width="24">
            </a>
            <a href="https://youtube.com/@1careclinics709" style="text-decoration: none; margin-left: 5px;">
              <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YT" width="24">
            </a>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function getParameterConfig(parameterName: string): ParameterConfig {
  const paramKey = parameterName.replace(/[\s-]/g, '').toUpperCase();
  const visionConfig: ParameterConfig = {
    rangeTitle: 'VISION RANGE',
    columns: [
      { label: 'High Concern', value: 'L:- >6/9 , R:- >6/9', class: 'bg-high' },
      { label: 'Moderate Concern', value: 'L- 6/9, R-6/9', class: 'bg-mod' },
      { label: 'Borderline', value: '6/9', class: 'bg-border' },
      { label: 'Normal', value: '6/6', class: 'bg-norm' },
    ],
  };
  const configs: Record<string, ParameterConfig> = {
    TEMPERATURE: {
      rangeTitle: 'TEMPERATURE RANGE (°F)',
      columns: [
        { label: 'High Concern (> range)', value: '> 102.1', class: 'bg-high' },
        { label: 'Moderate Concern (> range)', value: '100.1 - 102', class: 'bg-mod' },
        { label: 'Borderline (> range)', value: '99.1 - 100', class: 'bg-border' },
        { label: 'Normal', value: '97 - 99', class: 'bg-norm' },
        { label: 'Borderline (< range)', value: '95.1 - 96.9', class: 'bg-border' },
        { label: 'Moderate Concern (< range)', value: '< 95', class: 'bg-mod' },
      ],
    },
    SPO2: {
      rangeTitle: 'SpO2 SATURATION RANGE (%)',
      columns: [
        { label: 'Normal', value: '95 - 100', class: 'bg-norm' },
        { label: 'Borderline Value', value: '94.1 - 94.9', class: 'bg-border' },
        { label: 'Moderate Concern', value: '94 - 91', class: 'bg-mod' },
        { label: 'High Concern', value: '< 90', class: 'bg-high' },
      ],
    },
    RANDOMBLOODSUGAR: {
      rangeTitle: 'RANDOM BLOOD SUGAR RANGE (mg/dL)',
      columns: [
        { label: 'High Concern (High)', value: '≥ 350', class: 'bg-high' },
        { label: 'Moderate Concern (High)', value: '200 - 349', class: 'bg-mod' },
        { label: 'Borderline Value (High)', value: '141 - 199', class: 'bg-border' },
        { label: 'Normal', value: '110 - 140', class: 'bg-norm' },
        { label: 'Borderline Value (Low)', value: '71 - 110', class: 'bg-border' },
        { label: 'Moderate Concern (Low)', value: '70 - 55', class: 'bg-mod' },
        { label: 'High Concern (Low)', value: '< 55', class: 'bg-high' },
      ],
    },
    PULSE: {
      rangeTitle: 'PULSE RATE RANGE (bpm)',
      columns: [
        { label: 'High Concern (> range)', value: '> 140', class: 'bg-high' },
        { label: 'Moderate Concern (> range)', value: '120 - 140', class: 'bg-mod' },
        { label: 'Borderline (> range)', value: '100 - 119', class: 'bg-border' },
        { label: 'Normal', value: '60 - 100', class: 'bg-norm' },
        { label: 'Borderline (< range)', value: '51 - 59', class: 'bg-border' },
        { label: 'Moderate Concern (< range)', value: '40 - 50', class: 'bg-mod' },
        { label: 'High Concern (< range)', value: '< 40', class: 'bg-high' },
      ],
    },
    BLOODPRESSURE: {
      rangeTitle: 'BLOOD PRESSURE (Systolic Reference)',
      columns: [
        { label: 'High', value: '>160 / >102', class: 'bg-high' },
        { label: 'Moderate', value: '140-160 / 90-101', class: 'bg-mod' },
        { label: 'Borderline', value: '121-139 / 81-89', class: 'bg-border' },
        { label: 'Normal', value: '100-120 / 70-80', class: 'bg-norm' },
      ],
    },
    VISION: visionConfig,
    EYEVISION: visionConfig,
    EYE_VISION: visionConfig,
  };

  return (
    configs[paramKey] || {
      rangeTitle: `${parameterName} REFERENCE RANGE`,
      columns: [
        { label: 'High Concern', value: 'Above Limit', class: 'bg-high' },
        { label: 'Normal', value: 'Within Limit', class: 'bg-norm' },
        { label: 'Low Concern', value: 'Below Limit', class: 'bg-high' },
      ],
    }
  );
}
