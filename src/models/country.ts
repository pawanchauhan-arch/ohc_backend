import { Table, Column, Model, HasMany } from 'sequelize-typescript';
import { State } from './state';

@Table({ tableName: 'countries', timestamps: false })
export class Country extends Model {
  @Column
  name: string;

  @HasMany(() => State)
  states: State[];
}
