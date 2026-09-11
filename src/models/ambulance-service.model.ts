import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { PatientType, ServiceStatus } from '../common/enum';
import { Ambulance } from './ambulance.model';

@Table({ tableName: 'ambulance_services', timestamps: true })
export class AmbulanceService extends Model<AmbulanceService> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  tenant_id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  center_id: string;

  @ForeignKey(() => Ambulance)
  @Column({ type: DataType.UUID, allowNull: false })
  ambulance_id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  start_point: string;

  @Column({ type: DataType.STRING, allowNull: false })
  end_point: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  pickup_address: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  drop_address: string;

  @Column({ type: DataType.STRING, allowNull: false })
  patient_name: string;

  @Column({ type: DataType.STRING(10), allowNull: true })
  patient_mobile?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  major_symptom?: string;

  @Column({
    type: DataType.ENUM(...Object.values(PatientType)),
    allowNull: false,
  })
  patient_type: PatientType;

  @Column({
    type: DataType.ENUM(...Object.values(ServiceStatus)),
    allowNull: false,
    defaultValue: ServiceStatus.PENDING,
  })
  status: ServiceStatus;

  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt: Date;

  @BelongsTo(() => Ambulance)
  ambulance: Ambulance;
}
