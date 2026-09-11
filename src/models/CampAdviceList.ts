import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey
} from 'sequelize-typescript';
import { PicasoPatientCampConsultingSheetDetails } from './PatientCampConsultingSheetdetails';
import { Sequelize } from 'sequelize-typescript';

@Table({
  tableName: 'picaso_campadvicelist',
  timestamps: false,
})
export class PicasoCampAdviceList extends Model {
  @Column({
    field: 'ID',
    type: DataType.BIGINT,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  })
  ID!: number;

  @Column({
    field: 'PicasoID',
    type: DataType.STRING(100),
    allowNull: true,
  })
  picasoId!: string | null;

  @Column({
    field: 'ConsultingID',
    type: DataType.BIGINT,
    allowNull: true,
  })
  consultingId!: number | null;

  @Column({
    field: 'ItemID',
    type: DataType.BIGINT,
    allowNull: true,
  })
  itemId!: number | null;

  @Column({
    field: 'Item',
    type: DataType.STRING(100),
    allowNull: true,
  })
  item!: string | null;

  @Column({
    field: 'Dosage',
    type: DataType.STRING(200),
    allowNull: true,
  })
  dosage!: string | null;

  @Column({
    field: 'Pillsconsumption',
    type: DataType.STRING(50),
    allowNull: true,
  })
  pillsConsumption!: string | null;

  @Column({
    field: 'Duration',
    type: DataType.INTEGER,
    allowNull: true,
  })
  duration!: number | null;
 @ForeignKey(() => PicasoPatientCampConsultingSheetDetails)
  @Column({
    field: 'PrescriptionID',
    type: DataType.BIGINT,
    allowNull: true,
  })
  prescriptionId!: number | null;

  @Column({
    field: 'Remarks',
    type: DataType.STRING(100),
    allowNull: true,
  })
  remarks!: string | null;

  @Column({
    field: 'AddedBy',
    type: DataType.BIGINT,
    allowNull: true,
  })
  addedBy!: number | null;

  @Column({
    field: 'AddedDate',
    type: DataType.DATE,
    allowNull: true,
    defaultValue: Sequelize.literal("timezone('Asia/Kolkata', now())")
  })
  addedDate!: Date | null;

  @Column({
    field: 'ModifiedDate',
    type: DataType.DATE,
    allowNull: true,
    defaultValue: Sequelize.literal("timezone('Asia/Kolkata', now())")
  })
  modifiedDate!: Date | null;

  @Column({
    field: 'ModifiedBy',
    type: DataType.STRING(50),
    allowNull: true,
  })
  modifiedBy!: string | null;

  @Column({
    field: 'CompanyID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  companyId!: number | null;

  @Column({
    field: 'IsActive',
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  isActive!: boolean | null;

  @Column({
    field: 'TypeofMedicine',
    type: DataType.STRING(100),
    allowNull: true,
  })
  typeOfMedicine!: string | null;

  @BelongsTo(() => PicasoPatientCampConsultingSheetDetails, {
    foreignKey: 'PrescriptionID',
    targetKey: 'ID',
  })
  prescription?: PicasoPatientCampConsultingSheetDetails;

  @Column({
    field: 'center_id',
    type: DataType.BIGINT,
    allowNull: true,
  })
  center_id!: number | null;
  @Column({
    field: 'tenant_id',
    type: DataType.BIGINT,
    allowNull: true,
  })
  tenant_id!: number | null;
}
