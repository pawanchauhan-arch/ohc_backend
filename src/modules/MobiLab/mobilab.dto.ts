// services/mobilab.dto.ts
import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// --- Common Interfaces ---
export interface ApiBaseResponse {
  error: boolean;
  message: string;
}

// --- Auth ---
export interface AccessTokenResponse extends ApiBaseResponse {
  'access-token'?: string;
}

// --- Tests & Profiles ---
export interface AvailableTest {
  test_id: string;
  test_name: string;
  test_name_id: string;
}

export interface AvailableProfile {
  profile_id: string;
  profile_name: string;
  tests: {
    test_id: number;
    test_name: string;
  }[];
}

// --- Users ---
export class CreateMobileUserDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() phone?: number; // PDF says number, optional
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() password: string;
}

/** Request body for POST /api/mobilab/users - supports single or multiple centers */
export class CreateMobileUserRequestDto extends CreateMobileUserDto {
  /** Single center ID (use when mapping to one center) */
  @IsOptional()
  @IsInt()
  center_id?: number;

  /** Multiple center IDs (use when mapping one mobilab user to multiple centers) */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  center_ids?: number[];
}

export class UpdateMobileUserDto {
  @IsInt() @IsNotEmpty() id: number;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() phone?: number;
  @IsOptional() username?: string; // Required when mapping to centers that don't have this user yet
  @IsOptional() @IsString() password?: string;
  @IsIn(['active', 'inactive']) status: 'active' | 'inactive';
}

/** Request body for PUT /api/mobilab/users - supports single or multiple centers */
export class UpdateMobileUserRequestDto extends UpdateMobileUserDto {
  @IsOptional()
  @IsInt()
  center_id?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  center_ids?: number[];
}

export interface MobilabUserCenter {
  id: number;
  project_name: string;
  project_unique_id: string;
  short_code?: string;
}


export interface MobileUser {
  id: string;
  name: string;
  phone: string;
  userName: string; // Note: PDF response has 'userName' camelCase in some places, 'username' in others. Logic handles both.
  status: 'active' | 'inactive';
  centers?: MobilabUserCenter[];
}

// --- Devices ---
export interface DeviceDetail {
  dev_id: string;
  clinic_name: string;
  dev_unique_id: string;
  installation_date: string;
}

// --- Booking ---
export class TestItemDto {
  @IsString() @IsNotEmpty() test_id: string;
  @IsString() @IsNotEmpty() test_name: string;
}

export class ProfileItemDto {
  @IsString() @IsNotEmpty() profile_id: string;
}

export class BookTestDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() fullname: string;
  @IsInt() @IsNotEmpty() age: number;
  @IsString() @IsNotEmpty() gender: string;
  @IsInt() @IsNotEmpty() height: number;
  @IsInt() @IsNotEmpty() weight: number;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() city?: string;
  @IsString() @IsOptional() state?: string;
  @IsString() @IsOptional() zip?: string;
  @IsString() @IsOptional() country?: string;

  // For individual tests
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestItemDto)
  @IsOptional()
  tests?: TestItemDto[];

  // For profile tests
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileItemDto)
  @IsOptional()
  profiles?: ProfileItemDto[];
}

// --- Results ---
export interface TestResultItem {
  test_name: string;
  calculated_value: string;
  profile_name?: string; // Present if part of a profile
}

export interface TestResultDetails {
  fullname: string;
  age: string; // PDF response shows "age": "22" (string) in getResult
  gender: string;
  test_results: TestResultItem[];
}