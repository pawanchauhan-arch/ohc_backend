import { Column, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'test_accounts',
  timestamps: true,
})
export class TestAccount extends Model {
  @Column({
    allowNull: true,
  })
  phone: string;

  @Column({
    allowNull: true,
  })
  otp: string;

  @Column({
    allowNull: true,
  })
  email: string;

  @Column({
    allowNull: true,
  })
  password: string;

  @Column({
    allowNull: false,
    defaultValue: true,
  })
  isTestAccount: boolean;

  @Column({
    allowNull: true,
  })
  description: string;
} 