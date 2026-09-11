import { Table, Column, Model, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { State } from './state';

@Table({ tableName: 'districts', timestamps: false })
export class District extends Model {
    @Column
    name: string;

    @ForeignKey(() => State)
    @Column
    state_id: number;

    @BelongsTo(() => State)
    state: State;
}
