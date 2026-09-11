import { Injectable } from '@nestjs/common';
import { Country } from '../../models/country';
import { State } from '../../models/state';
import { District } from '../../models/district';

@Injectable()
export class LocationService {
  async getCountries() {
    return await Country.findAll();
  }

  async getStatesByCountry(countryId: number) {
    return await State.findAll({ where: { country_id: countryId } });
  }

  async getDistrictsByState(stateId: number) {
    return await District.findAll({ where: { state_id: stateId } });
  }
}
