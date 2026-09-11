import {
  Column,
  Model,
  Table,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ServiceTypeMaster } from './ServiceTypeMaster';

@Table({
  tableName: 'service_master',
  timestamps: false, // we have custom AddedDate/ModifiedDate
})
export class ServiceMaster extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  ID: number;

  @Column({ type: DataType.STRING, allowNull: false })
  Code: string;

  @ForeignKey(() => ServiceTypeMaster)
  @Column({ type: DataType.INTEGER, allowNull: false })
  ServiceTypeID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  SubServiceTypeID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  IPDServiceType: number;

  @Column({ type: DataType.INTEGER, allowNull: true }) // Use less as per Pawan chauhan
  CategoryID: number;

  @Column({ type: DataType.STRING, allowNull: false })
  ServiceName: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  ServiceCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  SurgeonCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  AnaesthesiaCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  OTCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  PWFCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  AssistantSurgeonCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  TotalOtCharge: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  TotalTarifCharge: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  DepartmentID: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  AddedBy: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  AddedDate: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  ModifiedDate: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  ModifiedBy: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  FinancialYear: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  HospitalID: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  IsActive: boolean;

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
    allowNull: false,
    defaultValue: [],
  })
  CenterIDs: number[];

  @BelongsTo(() => ServiceTypeMaster)
  serviceType: ServiceTypeMaster;

  @Column({ type: DataType.INTEGER, allowNull: true })
  center_id: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  tenant_id: number;
}
