import { Controller, Get, Param } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('api/location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('countries')
  getCountries() {
    return this.locationService.getCountries();
  }

  @Get('states/:countryId')
  getStates(@Param('countryId') countryId: number) {
    return this.locationService.getStatesByCountry(countryId);
  }

  @Get('districts/:stateId')
  getDistricts(@Param('stateId') stateId: number) {
    return this.locationService.getDistrictsByState(stateId);
  }
}
