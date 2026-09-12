const formatDate = (value?: string | Date) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN');
};

const esc = (value?: string | number | null) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const val = (value?: string | number | null) => esc(value) || '&nbsp;';

const isChecked = (value?: boolean | string | number | null) =>
  value === true || value === 'true' || value === 1;

const displayHistory = (value?: string | null) => {
  if (!value) return '';
  const v = String(value).toLowerCase();
  if (v === 'yes' || v === 'no') return v.charAt(0).toUpperCase() + v.slice(1);
  return String(value);
};

const underline = (text?: string | number | null, minWidth = '120px') =>
  `<span class="ul" style="min-width:${minWidth}">${val(text)}</span>`;

const dotted = (text?: string | number | null) =>
  `<span class="dotted">${val(text)}</span>`;

const checkbox = (checked: boolean) =>
  `<span class="cb">${checked ? '&#10003;' : ''}</span>`;

const checkLine = (checked: boolean, content: string) =>
  `<p class="check-line">${checkbox(checked)}<span class="check-text">${content}</span></p>`;

const textLine = (content: string) => `<p class="plain-line">${content}</p>`;

export const buildFitnessCertificateHtml = (
  cert: any,
  orgProfile?: Record<string, any> | null,
) => {
  const projectName = cert.project_name || orgProfile?.display_name || '';
  const issueDate = formatDate(cert.created_at || new Date());

  const physicalRows = [
    ['a)', 'Height', cert.height],
    ['b)', 'Weight', cert.weight],
    ['c)', 'Blood Pressure', cert.blood_pressure],
    ['d)', 'Pulse', cert.pulse],
    ['e)', 'Hearing', cert.hearing],
    ['f)', 'Refractive Error', cert.refractive_error],
    ['g)', 'Colour Vision', cert.color_vision],
    ['h)', 'Any Disability', cert.any_disability],
    ['i)', 'Arm Function &amp; Grip', cert.arm_grip],
    ['j)', 'Leg &amp; Foot Function', cert.leg_foot_function],
  ];

  const historyRows = [
    ['a)', 'Varicose', displayHistory(cert.prev_varicose)],
    ['b)', 'Seizure', displayHistory(cert.prev_seizure)],
    ['c)', 'Vertigo', displayHistory(cert.prev_vertigo)],
    ['d)', 'Acrophobia', displayHistory(cert.prev_acrophobia)],
    ['e)', 'Diabetes', displayHistory(cert.prev_diabetes)],
    ['f)', 'Stroke', displayHistory(cert.prev_stroke)],
    ['g)', 'Heart Diseases', displayHistory(cert.prev_heart_diseases)],
    ['h)', 'Major Illness or Surgery', displayHistory(cert.prev_major_illness_surgery)],
    ['i)', 'Symptoms Visible', cert.prev_symptoms_visible],
    ['j)', 'Others, if any', cert.prev_others],
  ];

  const tableRows = physicalRows
    .map(([prefix, label, value], index) => {
      const [hPrefix, hLabel, hValue] = historyRows[index];
      return `
        <tr>
          <td>${prefix} ${label}</td>
          <td>${val(value)}</td>
          <td>${hPrefix} ${hLabel}</td>
          <td>${val(hValue)}</td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.45;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm 14mm;
      page-break-after: always;
    }
    .page:last-child { page-break-after: auto; }
    .rule-ref { text-align: center; font-size: 11px; margin-bottom: 10px; }
    .title {
      text-align: center;
      font-weight: 700;
      font-size: 14px;
      margin: 0 0 18px;
      letter-spacing: 0.3px;
    }
    .row { margin-bottom: 12px; }
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 16px;
      gap: 16px;
    }
    .meta-left { flex: 1; }
    .meta-right { min-width: 170px; text-align: right; }
    .ul {
      border-bottom: 1px solid #000;
      display: inline-block;
      padding: 0 2px 1px;
      line-height: 1.2;
      vertical-align: bottom;
    }
    .dotted {
      border-bottom: 1px dotted #000;
      display: inline-block;
      flex: 1;
      min-width: 220px;
      padding: 0 2px 1px;
      vertical-align: bottom;
    }
    .id-block { margin-top: 6px; padding-left: 24px; }
    .id-2 { padding-left: 12px; margin-top: 8px; }
    .cert-text { text-align: justify; margin: 16px 0 18px; line-height: 1.5; }
    .reason-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      margin-bottom: 10px;
    }
    .sign-row {
      display: flex;
      justify-content: space-between;
      margin-top: 44px;
      gap: 20px;
    }
    .sign-left, .sign-right {
      width: 50%;
      font-weight: 700;
      font-size: 11px;
      line-height: 1.4;
    }
    .sign-right { text-align: right; }
    .note { margin-top: 36px; font-size: 11px; line-height: 1.45; }
    .note-indent { padding-left: 38px; }
    .annex-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-weight: 700;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th, td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: top;
      font-size: 11px;
      line-height: 1.35;
    }
    th { font-weight: 700; text-align: center; }
    .section-title {
      font-weight: 700;
      text-decoration: underline;
      margin-bottom: 6px;
    }
    .section { margin-bottom: 12px; }
    .check-line {
      display: flex;
      align-items: flex-start;
      margin: 0 0 5px;
      text-align: justify;
    }
    .check-text { flex: 1; }
    .cb {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #000;
      margin-right: 6px;
      margin-top: 2px;
      text-align: center;
      font-size: 10px;
      line-height: 11px;
      flex-shrink: 0;
      font-weight: 700;
    }
    .plain-line { margin: 0 0 3px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="rule-ref">[(see rule 111 (c)]</div>
    <h1 class="title">CERTIFICATE OF MEDICAL EXAMINATION</h1>

    <div class="row">Name of the Project : ${underline(projectName, '68%')}</div>

    <div class="meta">
      <div class="meta-left">
        Certificate Serial No. ${underline(cert.certificate_number || '', '52%')}
      </div>
      <div class="meta-right">Date : ${underline(issueDate, '110px')}</div>
    </div>

    <div class="row">1. Name of the workman : ${underline(cert.workman_name, '60%')}</div>
    <div class="row">2. **Trade of the workman : ${underline(cert.trade, '56%')}</div>

    <div class="row">
      3. Identification marks :
      <div class="id-block">
        <div>(1) ${underline(cert.identification_mark_1, '72%')}</div>
        <div class="id-2">(2) ${underline(cert.identification_mark_2, '70%')}</div>
      </div>
    </div>

    <div class="row">4. Father's/ Husband's/ wife's Name : ${underline(cert.guardian_name, '50%')}</div>
    <div class="row">5. Sex : ${underline(cert.sex, '22%')}</div>
    <div class="row">6. Residence Address : ${underline(cert.residence_address, '58%')}</div>

    <div class="row">
      7. Date of birth, if available : ${underline(formatDate(cert.date_of_birth), '120px')}
      <span style="margin-left:6px">and/or certificate age</span>
      ${underline(cert.certificate_age, '90px')}
    </div>

    <p class="cert-text">
      I hereby certify that I have personally examined as per the physical &amp; medical
      examinations prescribed in the given annexure-I (name)
      ${underline(cert.workman_name, '170px')} who is desirous of being employed in building
      and construction work and that he/she is fit for employment in
      ${underline(projectName, '170px')}.
    </p>

    <div class="row">8. Reason for--</div>
    <div class="reason-row"><span>(1) Refusal of certificate</span>${dotted(cert.reason_refusal)}</div>
    <div class="reason-row" style="margin-bottom:32px"><span>(2) Certificate being revoked</span>${dotted(cert.reason_revoked)}</div>

    <div class="sign-row">
      <div class="sign-left">Signature/Left hand Thumb impression of building worker</div>
      <div class="sign-right">Signature with Seal Medical Inspector/ C.M.O</div>
    </div>

    <div class="note">
      <div><strong>Note :</strong> 1. Exact details of cause of physical disability should be clearly stated.</div>
      <div class="note-indent">2. Functional/productive abilities should also be stated if disability is stated.</div>
    </div>
  </div>

  <div class="page">
    <div class="annex-header">
      <span>Medical Examination for all workmen</span>
      <span>Anex-1</span>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:24%">Physical Examination</th>
          <th style="width:26%"></th>
          <th style="width:24%">Enquiry of previous history</th>
          <th style="width:26%"></th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <div class="section">
      <div class="section-title">Additional checks for Operators &amp; Drivers (As Per Bocw Act &amp; Rules)</div>
      ${checkLine(isChecked(cert.op_general_physique), '<strong>(i) General Physique;</strong>')}
      ${checkLine(
        isChecked(cert.op_vision),
        '<strong>(ii) Vision—</strong> Total visual performance using standard orthorator like Titmus Vision Tester should be estimated and suitability for placement ascertaines in accordance with the prescribed job standards.',
      )}
      ${checkLine(
        isChecked(cert.op_hearing),
        '<strong>(iii) Hearing—</strong> Persons with normal hearing must be able to hear a forced whisper at twenty-four feet. Person using hearing aids must be able to hear a warning shout under noisy working conditions.',
      )}
      ${checkLine(
        isChecked(cert.op_breathing),
        '<strong>(iv) Breathing—</strong> Peak flow rate using standard peak flow meter and the average peak flow rate determined out of these readings of the test performed. The results recorded at pre-placement medical examination could be used as a standard for the same individual at the same altitude for reference during subsequent examination.',
      )}
      ${checkLine(
        isChecked(cert.op_upper_limbs),
        '<strong>(v) Upper Limbs—</strong> Adequate arm function and grip (both arms).',
      )}
      ${checkLine(
        isChecked(cert.op_lower_limbs),
        '<strong>(vi) Lower Limbs—</strong> Adequate leg and foot function.',
      )}
      ${checkLine(
        isChecked(cert.op_spine),
        '<strong>(vii) Spine—</strong> Adequately flexible for the job concerned.',
      )}
      ${checkLine(
        isChecked(cert.op_general_mental_alertness),
        '<strong>(viii) General—</strong> Mental alertness and stability with good eye, hand and foot coordination.',
      )}
      ${textLine(
        `<strong>(c) Any other tests</strong> which the examining doctor considers necessary. ${underline(cert.op_other_examination, '140px')}`,
      )}
    </div>

    <div class="section">
      <div class="section-title">Additional checks for Food Handlers (Workmen involved in preparation &amp; supply)</div>
      ${checkLine(isChecked(cert.fh_skin_diseases), 'Careful examination for skin diseases')}
      ${checkLine(isChecked(cert.fh_personal_hygiene), 'Personal hygiene such as hair, nails etc.')}
      ${textLine(
        `Chest X-ray if preliminary examination reveals chest congestion (Separate reports to be attached, if conducted) ${underline(cert.fh_chest_xray, '120px')}`,
      )}
    </div>

    <div class="section">
      <div class="section-title">Additional checks for Welders</div>
      ${checkLine(
        isChecked(cert.welder_respiratory_diseases),
        'Examine &amp; check for symptoms of respiratory diseases.',
      )}
      ${textLine(
        `If suspected Chest X-ray taken to confirm fitness (Separate reports to be attached, if conducted) ${underline(cert.welder_chest_xray, '120px')}`,
      )}
    </div>
  </div>
</body>
</html>
`;
};
