export interface ApiResponse<T> {
  status: boolean;
  code: number;
  data: T;
  message: string;
}

export interface OrganizationDTO {
  organization_id: number;
  organization_name: string;
  email: string;
  contact_number: string;
  centers?: {
    center_id: number;
    project_name: string;
  }[];
}