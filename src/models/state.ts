import { Table, Column, Model, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Country } from './country';
import { District } from './district';

@Table({ tableName: 'states', timestamps: false })
export class State extends Model {
  @Column
  name: string;

  @ForeignKey(() => Country)
  @Column
  country_id: number;

  @BelongsTo(() => Country)
  country: Country;

  @HasMany(() => District)
  districts: District[];
}
