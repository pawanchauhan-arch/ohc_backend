import { Column, Model, Table, ForeignKey, BelongsTo, DataType, PrimaryKey } from 'sequelize-typescript';
import { Prescription } from './Prescription';

@Table({
  tableName: 'prescriptionmedicine',
  timestamps: true,
})
export class PrescriptionMedicine extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  prescription_medicine_id: string;

  @ForeignKey(() => Prescription)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  prescription_id: string;

  @BelongsTo(() => Prescription)
  prescription: Prescription;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  medicine_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  dosage: string;

  // @Column({
  //   type: DataType.ARRAY(DataType.ENUM("Morning", "Afternoon", "Evening", "Night", "SOS" , "STAT")),
  //   allowNull: false,
  // })
  // frequency: string[];
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
  })
  frequency: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  medicine_type: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  duration: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  instructions: string;
}
