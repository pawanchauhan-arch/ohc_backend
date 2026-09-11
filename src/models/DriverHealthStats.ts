import {Column,Model,Table,ForeignKey,DataType,PrimaryKey,BelongsTo,} from 'sequelize-typescript';
import { DRIVERMASTER } from './DriverMaster';
  
  @Table({
    tableName: 'driverhealthstats',
    timestamps: true,
  })
  export class DriverHealthStats extends Model {
    @PrimaryKey
    @Column({
      type: DataType.INTEGER,
      autoIncrement: true,
      allowNull: false,
    })
    id: number;
  
    @ForeignKey(() => DRIVERMASTER)
    @Column({
      type: DataType.INTEGER,
      allowNull: false,
    })
    driver_id: number;
  
    @BelongsTo(() => DRIVERMASTER)
    driver: DRIVERMASTER;
  
    @Column({
      type: DataType.ENUM('Low Blood Sugar (Hypoglycemia)', 'Normal', 'Prediabetes', 'Diabetes'),
      allowNull: true,
    })
    diabetes_status: string;
  
    @Column({
      type: DataType.ENUM('Hypotension', 'Normal', 'High-Normal', 'Stage 1 Hypertension', 'Stage 2 Hypertension' , 'Optimal'),
      allowNull: true,
    })
    cardiac_status: string;
  }
  