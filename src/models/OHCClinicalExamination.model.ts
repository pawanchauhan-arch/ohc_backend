import {
  Table,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { DRIVERMASTER } from 'src/models/DriverMaster';

@Table({
  tableName: 'ohc_clinical_examination',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class OHCClinicalExamination extends BaseModel<OHCClinicalExamination> {

  @ForeignKey(() => DRIVERMASTER)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  patient_id: number;

  @Column(DataType.TEXT)
  general_appearance?: string;

  @Column(DataType.TEXT)
  eye_examination?: string;

  @Column(DataType.TEXT)
  ear?: string;

  @Column(DataType.TEXT)
  nose?: string;

  @Column(DataType.TEXT)
  throat?: string;

  @Column(DataType.TEXT)
  cardiovascular_system?: string;

  @Column(DataType.TEXT)
  respiratory_system?: string;

  @Column(DataType.TEXT)
  abdomen?: string;

  @Column(DataType.TEXT)
  nervous_system?: string;

  @Column(DataType.TEXT)
  musculoskeletal_system?: string;

  @Column(DataType.TEXT)
  skin_condition?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_deleted: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  created_by: number;

  @Column(DataType.INTEGER)
  updated_by?: number;
  @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    name?: string;
     @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    gender?: string;
  
    @Column({
      type: DataType.INTEGER,
      allowNull: true,
    })
    age?: number;
    @Column({
      type: DataType.INTEGER,
      allowNull: true,
    })
     employee_id: string;
     @Column({
  type: DataType.STRING,
  allowNull: true,
})
color_blindness?: string;
}