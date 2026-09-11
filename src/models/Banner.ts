
import { Column,Model,Table,DataType,PrimaryKey } from 'sequelize-typescript';

export enum WorkforceType {Driver = 'driver',Blue_Collar = 'blue_collar'}

export enum PlaceHolderInApp {
  HomePage1 = 'home_page_1',
  HomePage2 = 'home_page_2',
  ConsultationPage1 = 'consultation_page_1',
  ReportsPage1 = 'reports_page_1',
  SupportPage1 = 'support_page_1',
}

@Table({
  tableName: 'banners',
  timestamps: true,
})
export class Banner extends Model {
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    allowNull: false,
  })
  banner_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  language: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  category: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  state: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  location: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  workforce_type: WorkforceType;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  hyperlink: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  video_link: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  image_link: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  disease: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  title: string;

  @Column({
    type: DataType.ENUM,
    values: [
      PlaceHolderInApp.HomePage1,
      PlaceHolderInApp.HomePage2,
      PlaceHolderInApp.ConsultationPage1,
      PlaceHolderInApp.ReportsPage1,
      PlaceHolderInApp.SupportPage1,
    ],
    allowNull: true,
  })
  place_holder_in_app: PlaceHolderInApp;
}