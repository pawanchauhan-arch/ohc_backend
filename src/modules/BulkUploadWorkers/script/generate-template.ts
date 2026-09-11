/**
 * Standalone script to generate and preview the bulk upload Excel template.
 * Run: npm run generate-template
 */
import * as fs from 'fs';
import * as path from 'path';
import { BulkUploadTemplateService } from '../bulk-upload-template.service';
import { LookupService } from '../lookup/lookup.service';
import {
  MOCK_COUNTRIES,
  MOCK_STATES,
  MOCK_DISTRICTS,
  MOCK_DEPARTMENTS,
  MOCK_DESIGNATIONS,
} from '../lookup/mock-lookup.data';

class MockLookupService extends LookupService {
  constructor() {
    super(null as any);
  }
  async getCountries() { return MOCK_COUNTRIES; }
  async getStates() { return MOCK_STATES; }
  async getDistricts() { return MOCK_DISTRICTS; }
  async getDepartments(_tenantId: number) { return MOCK_DEPARTMENTS; }
  async getDesignations(_tenantId: number) { return MOCK_DESIGNATIONS; }
}

async function main() {
  const lookup = new MockLookupService();
  const templateService = new BulkUploadTemplateService(lookup);

  const buffer = await templateService.generate(1);

  const outDir = path.join(__dirname, '..', 'output');
  fs.mkdirSync(outDir, { recursive: true });

  const filename = `patient_bulk_upload_template_${Date.now()}.xlsx`;
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, buffer);

  console.log(`✅ Template generated: ${outPath}`);
  console.log(`   Size: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log('');
  console.log('Sheets included:');
  console.log('  1. Instructions');
  console.log('  2. Patient Data  (main entry + sample row)');
  console.log('  3. Countries');
  console.log('  4. States');
  console.log('  5. Districts');
  console.log('  6. Departments');
  console.log('  7. Designations');
}

main().catch((err) => {
  console.error('Failed to generate template:', err);
  process.exit(1);
});
