import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, UseInterceptors, UploadedFile, Query, Res, HttpException, HttpStatus, Logger, UseGuards, Header } from '@nestjs/common';
import { PrescriptionService } from './Prescription.service';
import { Prescription } from '../../models/Prescription';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('api/prescriptions')
export class PrescriptionController {
  private readonly logger = new Logger(PrescriptionController.name);

  constructor(private readonly prescriptionService: PrescriptionService) { }

  @Post()
  async createPrescription(@Body() prescriptionData: Partial<Prescription>): Promise<Prescription> {
    return this.prescriptionService.createPrescription(prescriptionData);
  }

  @Get()
  async getAllPrescriptions(): Promise<Prescription[]> {
    return this.prescriptionService.getAllPrescriptions();
  }
  @Get('view')
  async getAll(@Query() query: any) {
    return await this.prescriptionService.getAllPrescriptionsDetails(query);
  }

  @Get(':id')
  async getPrescriptionById(@Param('id') id: string): Promise<Prescription> {
    const prescription = await this.prescriptionService.getPrescriptionById(id);
    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found.`);
    }
    return prescription;
  }

  @Put(':id')
  async updatePrescription(
    @Param('id') id: string,
    @Body() prescriptionData: Partial<Prescription>,
  ): Promise<Prescription> {
    const updatedPrescription = await this.prescriptionService.updatePrescription(id, prescriptionData);
    if (!updatedPrescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found.`);
    }
    return updatedPrescription;
  }

  @Delete(':id')
  async deletePrescription(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.prescriptionService.deletePrescription(id);
    if (!success) {
      throw new NotFoundException(`Prescription with ID ${id} not found.`);
    }
    return { success };
  }
  @Get('prescription/:consultationId')
  async getPrescriptionByConsultationId(@Param('consultationId') consultationId: string) {
    return this.prescriptionService.getPrescriptionByConsultationId(consultationId);
  }

  @Post('upload/:id')
  @UseInterceptors(FileInterceptor('file')) // Handle file upload
  async uploadPrescriptionImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.prescriptionService.uploadPrescriptionImage(id, file);
  }

  /**
   * Get all prescriptions for a specific driver
   * @param driverId The ID of the driver
   * @returns Array of prescriptions with associated data or empty array if none found
   */
  @Get('driver/:driverId')
  async getPrescriptionsByDriverId(@Param('driverId') driverId: number) {
    try {
      const driverIdNum = Number(driverId);
      if (isNaN(driverIdNum)) {
        throw new NotFoundException('Invalid driver ID format');
      }
      return this.prescriptionService.getPrescriptionsByDriverId(driverIdNum);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Error retrieving prescriptions: ${error.message}`);
    }
  }

  /**
   * Generate a PDF for a prescription
   * @param id The ID of the prescription
   * @param res The response object
   */
  @Get('pdf/:id')
  async generatePrescriptionPdf(
    @Param('id') id: string,
    @Query('type') type: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Generate prescription PDF
      const pdfBuffer = await this.prescriptionService.generatePrescriptionPdf(id, type);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="prescription-${id}.pdf"`,
      );

      // Send PDF file
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating prescription PDF:', error);

      // Send appropriate error response based on error type
      if (error instanceof NotFoundException) {
        res.status(404).json({ message: 'Prescription not found' });
      } else if (error.message.includes('not marked as ready')) {
        res.status(400).json({ message: 'Prescription is not ready for download' });
      } else {
        // For all other errors
        res.status(500).json({
          message: `Error generating prescription PDF: ${error.message || 'Unknown error'}`
        });
      }
    }
  }

  /**
   * Endpoint to manually trigger the mapping of prescriptions to health records.
   */
  @Post('map-health-records')
  async triggerMapping() {
    this.logger.log('Received request to map prescriptions to health records via API.');
    const result = await this.prescriptionService.mapPrescriptionsToHealthRecords();
    return {
      message: 'Prescription mapping process initiated and completed via API.',
      data: result,
    };
  }

  /**
   * Admin test endpoint for smoke testing the controller.
   */
  @Get('admin/test')
  adminTest() {
    this.logger.log('Prescription controller admin/test endpoint hit successfully.');
    return { message: 'Prescription controller is active and responding.', status: 'OK' };
  }

  @Get("export/excel")
  async exportExcel(
    @Query() query: any,
    @Res() res: Response
  ) {
    const buffer = await this.prescriptionService.exportPrescriptionExcel(query);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="prescriptions.xlsx"'
    );

    res.end(buffer);
  }


}
