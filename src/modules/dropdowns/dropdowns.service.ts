import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Dropdown } from './models/dropdown.interface';

/**
 * Service responsible for retrieving dropdown data
 */
@Injectable()
export class DropdownsService {
  /**
   * Retrieves all dropdown data from the DropDowns.js file
   * @returns Dropdown data as a JSON object
   */
  public getDropdowns(): Dropdown {
    try {
      const filePath = join(process.cwd(), 'docs', 'DropDowns.js');
      const fileContent = readFileSync(filePath, 'utf8');
      
      // Extract the JSON object from the JavaScript file
      const jsonContent = fileContent
        .replace('const DropDowns = ', '')
        .replace(/'/g, '"')
        .replace(/,(\s*})/g, '$1')
        .replace(/;$/, '');
      
      return JSON.parse(jsonContent);
    } catch (error) {
      throw new Error(`Failed to read dropdowns file: ${error.message}`);
    }
  }
} 