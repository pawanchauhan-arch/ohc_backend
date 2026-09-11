import { Controller, Put, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

/**
 * Controller for managing user operations
 */
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Updates user status
   * Accepts id, email, or phone to identify the user
   * If email or phone is provided, sets status to inactive (false)
   * If id is provided, uses the status from request body
   */
  @Put('update-status')
  async updateUserStatus(@Body() updateUserStatusDto: UpdateUserStatusDto): Promise<{ message: string; affectedRows?: number }> {
    return this.userService.updateUserStatus(updateUserStatusDto);
  }
}

