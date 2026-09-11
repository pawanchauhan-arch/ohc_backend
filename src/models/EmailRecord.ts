import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'email_records',
  timestamps: false,
})
export class EmailRecord extends Model<EmailRecord> {
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    allowNull: false,
  })
  recipient: string[];

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    allowNull: true,
    defaultValue: [],
  })
  cc?: string[];

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  supervisor_name: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
  })
  supervisor_contact_number: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  email_sent_by: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  center_id: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_on: Date;
  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  concern: string;
  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  driver_name: string;
  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  parameter: string;
}
