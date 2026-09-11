import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CorporateService } from './corporate.service';
import { CreateCorporateDto } from './dto/create-corporate.dto';
import { CreateAndAssignUserDto } from './dto/assign-corporate-user.dto';
import { HealthCheckupService } from './health-checkup.service';
import { CorporateHistoryDto, SpecificCenterHistoryDto, GetCorporateDriversDto } from './dto/health-history.dto';


@Controller('corporates')
export class CorporateController {
  constructor(private readonly corporateService: CorporateService,
            private readonly healthService: HealthCheckupService 
  ) {}

  // 1. Create a new Corporate Entity
  @Post()
  create(@Body() createCorporateDto: CreateCorporateDto) {
    return this.corporateService.create(createCorporateDto);
  }

  // 2. Get all Corporates
  @Get()
  findAll() {
    return this.corporateService.findAll();
  }

  // Get all corporate users with full user details and corporate name
  @Get('users')
  getAllCorporateUsers() {
    return this.corporateService.getAllCorporateUsers();
  }

  // 3. Get one Corporate by ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.corporateService.findOne(id);
  }

  // 4. Update Corporate
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCorporateDto: Partial<CreateCorporateDto>) {
    const { id: _bodyId, ...rest } = (updateCorporateDto as any) || {};
    return this.corporateService.update(id, rest);
  }

  // 5. Delete Corporate
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.corporateService.remove(id);
  }

  // 6. Assign a User to a Corporate
  @Post('users/assign')
  assignUser(@Body() assignDto: CreateAndAssignUserDto) {
    return this.corporateService.createAndAssignUser(assignDto);
  }

  // 7. Remove a User from a Corporate
  @Delete(':corporateId/users/:userId')
  unassignUser(
    @Param('corporateId', ParseIntPipe) corporateId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    return this.corporateService.removeUserFromCorporate(corporateId, userId);
  }

  // 8. Corporate user active/inactive toggle (login enable/disable)
  @Post('users/status/update')
  updateCorporateUserStatus(@Body() body: { corporateId: number; userId: number; status: boolean }) {
    return this.corporateService.updateCorporateUserLoginStatus(body);
  }


  @Post('health-checkup/history')
  async getCorporateHistory(@Body() dto: CorporateHistoryDto) {
    return this.healthService.getHistoryByCorporate(dto);
  }

  // 2. Get History for a SPECIFIC Center in a Corporate
  @Post('health-checkup/center/history')
  async getCorporateCenterHistory(@Body() dto: SpecificCenterHistoryDto) {
    return this.healthService.getHistoryBySpecificCenter(dto);
  }

  @Post('drivers/list')
  async getDriversList(@Body() dto: GetCorporateDriversDto) {
    return this.healthService.getDriversByCorporateCenters(dto);
  }


}
