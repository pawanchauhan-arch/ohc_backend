import {
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import {
  AmbulanceStatus,
  AmbulanceType,
  FuelType,
} from '../common/enum';
import { AmbulanceService } from './ambulance-service.model';

@Table({ tableName: 'ambulances', timestamps: true })
export class Ambulance extends Model<Ambulance> {
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

  @Column({ type: DataType.STRING, allowNull: false })
  company_name: string;

  @Column({
    type: DataType.ENUM(...Object.values(AmbulanceType)),
    allowNull: false,
  })
  ambulance_type: AmbulanceType;

  @Column({ type: DataType.INTEGER, allowNull: true })
  per_month_range?: number;

  @Column({
    type: DataType.ENUM(...Object.values(FuelType)),
    allowNull: false,
  })
  fuel_type: FuelType;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  number_plate: string;

  @Column({ type: DataType.STRING, allowNull: false })
  driver_name: string;

  @Column({ type: DataType.STRING(10), allowNull: false })
  driver_number: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  unique_name: string;

  @Column({
    type: DataType.ENUM(...Object.values(AmbulanceStatus)),
    allowNull: false,
    defaultValue: AmbulanceStatus.AVAILABLE,
  })
  status: AmbulanceStatus;

  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt: Date;

  @HasMany(() => AmbulanceService)
  services: AmbulanceService[];
}