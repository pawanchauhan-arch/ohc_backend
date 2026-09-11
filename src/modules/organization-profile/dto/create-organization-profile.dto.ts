export class CreateOrganizationProfileDto {
  tenant_id: number;

  center_id?: number;

  display_name: string;

  address?: string;

  mobile?: string;

  email?: string;

  logo?: string;

  secondary_logo?: string;

  watermark_text?: string;

  gst_number?: string;

  website?: string;

  theme_color?: string;

  report_header?: string;

  report_footer?: string;

  invoice_prefix?: string;
}