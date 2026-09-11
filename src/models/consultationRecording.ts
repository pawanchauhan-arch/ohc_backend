import { Column, Model, Table, ForeignKey, DataType, PrimaryKey, BelongsTo } from 'sequelize-typescript';
import { Consultation } from './Consultation';

@Table({
  tableName: 'consultationRecording',
  timestamps: true,
})
export class ConsultationRecording extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  id: string;

  @ForeignKey(() => Consultation)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  consultation_id: string;

  @BelongsTo(() => Consultation)
  consultation: Consultation;

  @Column(DataType.STRING)
  video_link: string;

  @Column(DataType.TEXT)
  transcript: string;

  @Column(DataType.STRING)
  audio_link: string;

  @Column({ type: DataType.STRING, allowNull: true })
  driver_audio: string;

  @Column({ type: DataType.STRING, allowNull: true })
  driver_video: string;

  @Column({ type: DataType.STRING, allowNull: true })
  doctor_audio: string;

  @Column({ type: DataType.STRING, allowNull: true })
  doctor_video: string;

}
