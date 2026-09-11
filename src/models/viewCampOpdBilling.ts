import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'view_opd_camp_billing_summary',
  timestamps: false,
})
export class ViewCampOpdBillingSummary extends Model<ViewCampOpdBillingSummary> {
  @Column({
    field: 'patient_id',
    type: DataType.INTEGER,
    primaryKey: true,
  })
  patient_id: number;

  @Column(DataType.STRING)
  patient_name: string;

  @Column(DataType.INTEGER)
  age: number;

  @Column(DataType.STRING)
  gender: string;

  @Column(DataType.STRING)
  localAddress: string;

  @Column(DataType.STRING)
  contactNumber: string;

  @Column(DataType.STRING)
  uhid: string;

  @Column(DataType.DECIMAL)
  TotalServiceAmount: number;

  @Column(DataType.DECIMAL)
  TotalDiscount: number;

  @Column(DataType.DECIMAL)
  PaidAmount: number;

  @Column(DataType.DECIMAL)
  DueAmount: number;

  @Column(DataType.INTEGER)
  bill_no: number;

  @Column(DataType.BOOLEAN)
  bill_status: boolean;

  @Column(DataType.STRING)
  ServiceType: string;

  @Column(DataType.STRING)
  added_by: string;

  @Column(DataType.STRING)
  doctor_name: string;

  @Column(DataType.STRING)
  center_name: string;

  @Column(DataType.STRING)
  payment_mode: string;

  @Column(DataType.STRING)
  patient_type: string;

  @Column(DataType.STRING)
  department_name: string;

  @Column(DataType.DATE)
  AddedDate: Date;

  @Column(DataType.STRING)
  unique_number: string;

  @Column(DataType.INTEGER)
  registration_number: number;

  @Column(DataType.STRING)
  qualification: string;

  @Column(DataType.STRING)
  complaint: string;
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  opd_billing_data: any;

  @Column(DataType.DECIMAL)
  CashAmount: number;

  @Column(DataType.DECIMAL)
  CardAmount: number;

  @Column(DataType.STRING)
  Remarks: string;

  @Column(DataType.INTEGER)
  token: number;

  @Column(DataType.INTEGER)
  added_by_id: number;

  @Column(DataType.INTEGER)
  center_id: number;

  @Column(DataType.INTEGER)
  tenant_id: number;
  
  @Column(DataType.STRING)
  refer_to: string;

  @Column(DataType.INTEGER)
  iage: number;
  
  @Column(DataType.INTEGER)
  imonth: number;
  
  @Column(DataType.INTEGER)
  idays: number;
}
