import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query } from '@nestjs/common';
import { RequestService } from './Request.service';
import { Request } from '../../models/Request';

@Controller('api/requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post('createRequest')
  async createRequest(@Body() requestData: Partial<Request>): Promise<Request> {
    return this.requestService.createRequest(requestData);
  }

  /**
   * Get all requests with optional filtering
   * @param status - Filter by status: 'pending', 'booked', or 'rejected' (optional)
   * @param centerID - Filter by center ID (optional)
   * @param groupID - Filter by group ID(s); comma-separated (e.g. "5,6"); fetches center IDs from center_groups and filters requests (optional)
   * @param daysBack - Number of days back to fetch requests (default: 2)
   * @returns Array of requests with driver and center details
   */
  @Get()
  async getAllRequests(
    @Query('status') status?: string,
    @Query('centerID') centerID?: string,
    @Query('groupID') groupID?: string,
    @Query('daysBack') daysBack?: string,
  ): Promise<Request[]> {
    const centerIdNumber = centerID ? parseInt(centerID, 10) : undefined;
    const groupIds = groupID
      ? groupID.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
      : undefined;
    const daysBackNumber = daysBack ? parseInt(daysBack, 10) : undefined;
    return this.requestService.getAllRequests(status, centerIdNumber, groupIds, daysBackNumber);
  }

  @Get(':id')
  async getRequestById(@Param('id') id: string): Promise<Request> {
    const request = await this.requestService.getRequestById(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    return request;
  }

  @Put(':id')
  async updateRequest(@Param('id') id: string, @Body() requestData: Partial<Request>): Promise<Request> {
    const updatedRequest = await this.requestService.updateRequest(id, requestData);
    if (!updatedRequest) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    return updatedRequest;
  }

  @Delete(':id')
  async deleteRequest(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.requestService.deleteRequest(id);
    if (!success) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    return { success };
  }
  @Get('driver/:driverId')
  async getRequestsByDriverId(@Param('driverId') driverId: number) {
    return this.requestService.getRequestsByDriverId(driverId);
  }

  // Endpoint to get the latest request with status false for a driver
  @Get('driver/:driverId/latest-pending')
  async getLatestPendingRequest(@Param('driverId') driverId: number) {
    return this.requestService.getLatestPendingRequest(driverId);
  }

  @Get('driver/:driverId/latest')
  async getLatestRequestByDriverId(@Param('driverId') driverId: number) {
    return this.requestService.getLatestRequestByDriverId(driverId);
  }

  @Put(':id/reject') // ✅ New endpoint for rejecting requests
  async rejectRequest(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.requestService.rejectRequest(id);
    if (!success) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    return { success };
  }

  @Put(':id/restore')
  async restoreRequest(@Param('id') request_id: string): Promise<{ success: boolean }> {
  const success = await this.requestService.restoreRequest(request_id);
  return { success };
}
}
