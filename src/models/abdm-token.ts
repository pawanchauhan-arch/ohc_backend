import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'abdm_tokens', timestamps: false }) // `timestamps: false` since we define `createdAt` explicitly
export class ABDMToken extends Model<ABDMToken> {
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  type: boolean; // 0 for session token, 1 for user-specific token

  @Column({ type: DataType.STRING, allowNull: true })
  phoneNumber?: string; // User's phone number, nullable for session tokens

  @Column({ type: DataType.TEXT, allowNull: true })
  accessToken?: string; // Session token or NULL for user-specific tokens

  @Column({ type: DataType.TEXT, allowNull: true })
  txnId?: string; // Transaction ID, nullable

  @Column({ type: DataType.TEXT, allowNull: true })
  xToken?: string; // X-Token, nullable for session tokens

  @Column({ type: DataType.DATE, allowNull: true })
  expiresAt?: Date; // Expiration timestamp, nullable

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  createdAt: Date; // Automatically set to current timestamp
}
