import { Controller, InternalServerErrorException, Logger } from "@nestjs/common";
import { SamplifyService } from "./samplify.service";
import { Post, Body } from "@nestjs/common";
import { CreateCustomerCampDto, CampPatientDto } from "./samplify.dto";


@Controller('api/samplify')
export class SamplifyController {
    private readonly logger = new Logger(SamplifyController.name);

    constructor(private readonly samplifyService: SamplifyService) {}

    @Post('create-customer-camp')
    async createCustomerCamp(@Body() dto: CreateCustomerCampDto) {
        return this.samplifyService.createCustomerCamp(dto);
    }

    @Post('fetch-customer-camp')
    async fetchCustomerCamp(@Body() dto: { camp_unique_id: string }) {
        return this.samplifyService.fetchCustomerCamp(dto.camp_unique_id);
    }

    @Post('update-customer-camp')
    async updateCustomerCamp(@Body() dto: CreateCustomerCampDto & { camp_unique_id: string }) {
        return this.samplifyService.updateCustomerCamp(dto.camp_unique_id, dto);
    }

    @Post('delete-customer-camp')
    async deleteCustomerCamp(@Body() dto: { camp_unique_id: string }) {
        return this.samplifyService.deleteCustomerCamp(dto.camp_unique_id);
    }

    @Post('add-camp-patients')
    async addCampPatients(@Body() dto: { camp_unique_id: string, patients: CampPatientDto[] }) {
        return this.samplifyService.addCampPatients(dto.camp_unique_id, dto.patients);
    }

    @Post('create-camp-to-samplify')
    async createCampToSamplify(@Body() dto: { camp_id: number }) {
        return this.samplifyService.createCamp_to_Samplify(dto.camp_id);
    }

    @Post('create-campDB-to-samplify')
    async createCampListDBToSamplify() {
        return this.samplifyService.createCampListDB_to_Samplify();
    }

    // To be Used Via Samplify To uopdate Phlebotomist and Barcode Data (in Camp list item)
    @Post('update-phlebotomist-patientResults')
    async updatePhlebotomistAndBarcodeData(@Body() dto : any) {
        const campUniqueId = dto?.camp_unique_id;
        this.logger.log(`[update-phlebotomist-patientResults] Request received for camp: ${campUniqueId || 'unknown'}`);
        try {
            const result = await this.samplifyService.updatePhlebotomistAndBarcodeData(dto);
            this.logger.log(`[update-phlebotomist-patientResults] Successfully processed camp: ${campUniqueId || 'unknown'}`);
            return result;
        } catch (error) {
            this.logger.error(
                `[update-phlebotomist-patientResults] Failed for camp: ${campUniqueId || 'unknown'} - ${error?.message || error}`,
                error?.stack,
            );
            throw error instanceof Error ? error : new InternalServerErrorException('Unexpected error while updating camp data');
        }
    }

    @Post('send-barcode-to-samplify')
    async sendBarcodeToSamplify(@Body() dto : { driver_id: number, camp_unique_id: string }) {
        return this.samplifyService.sendBarCodeToSamplify(dto.driver_id,dto.camp_unique_id);
    }

    @Post('add-camp-patient-driverId')
    async addCampPatientDriverId(@Body() dto : { driver_id: number, camp_unique_id: string }) {
        return this.samplifyService.addCampPatientId_(dto.driver_id,dto.camp_unique_id);
    }

    @Post('bulk-send-barcode-to-samplify')
    async bulkSendBarcodeToSamplify(@Body() dto : { camp_id: number, center_id: number }) {
        return this.samplifyService.BulkSendBarCodeToSamplify(dto.camp_id,dto.center_id);
    }

    @Post('bulk-add-camp-patient-to-samplify')
    async bulkAddCampPatientToSamplify(@Body() dto : { camp_id: number, center_id: number }) {
        return this.samplifyService.BulkAddDriverstoSamplify(dto.camp_id,dto.center_id);
    }

    
}
