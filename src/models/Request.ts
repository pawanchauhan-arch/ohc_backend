import { Column, Model, Table, DataType,ForeignKey,BelongsTo, AllowNull } from 'sequelize-typescript';
import { DRIVERMASTER } from './DriverMaster';
import { Center } from './Center';
import { Doctor } from './Doctor';

@Table({
  tableName: 'request',
  timestamps: true,
  paranoid:true,
})
export class Request extends Model {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
  })
  request_id: string;

  @ForeignKey(() => DRIVERMASTER)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  driver_id: number; 

  @BelongsTo(() => DRIVERMASTER, { as: 'requestDriver' })
  requestDriver: DRIVERMASTER;

  @ForeignKey(() => Center)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  centerID: number;

  @BelongsTo(() => Center, { as: 'requestCenter' })
  requestCenter: Center;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  status: boolean;

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    allowNull: true,
    })
    symptoms: string[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  preferred_time: Date | string |null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updatedAt: Date;


  @Column({
    type:DataType.DATE,
    allowNull:true,
  })
  deletedAt?: Date|null;

  @ForeignKey(() => Doctor)
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    allowNull: true,
  })
  preferredDoctorID: number;

  @Column({
    type: DataType.ENUM(
      'MBBS Doctor',
      'MD Orthopedic',
      'MD Pediatrician',
      'MD Gynecologist',
    ),
    allowNull: true,
  })
  preferredspecialist: string;

}
