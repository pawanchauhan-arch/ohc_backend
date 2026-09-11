import { Column, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'otps',
  timestamps: true,
})
export class Otp extends Model {
  @Column
  user_id: number;

  @Column
  phone: string;

  @Column
  otp: string;
}
