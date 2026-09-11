import { Controller, Get } from '@nestjs/common';
import { DropdownsService } from './dropdowns.service';
import { Dropdown } from './models/dropdown.interface';

/**
 * Controller for dropdown data management
 */
@Controller('/api/dropdowns')
export class DropdownsController {
  constructor(private readonly dropdownsService: DropdownsService) {}

  /**
   * Returns all dropdown data
   * @returns Dropdown data as a JSON object
   */
  @Get()
  public getDropdowns(): Dropdown {
    return this.dropdownsService.getDropdowns();
  }

  /**
   * Health check endpoint for testing
   * @returns Simple confirmation message
   */
  @Get('test')
  public testEndpoint(): { message: string } {
    return { message: 'Dropdowns API is working' };
  }
} 