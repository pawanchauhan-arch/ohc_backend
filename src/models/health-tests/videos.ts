// src/models/VideoCategoryReference.ts

import { Table, Column, Model, DataType } from 'sequelize-typescript';

// Define the structure for the JSON column for type safety
interface VideoLinksMap {
  [condition_range: string]: string; // e.g., "Higher than 30": "s3://bucket/path/to/high.mp4"
}

@Table({
  tableName: 'video_category_references',
  timestamps: true,
})
export class VideoCategoryReference extends Model {
  // Primary key and main identifier
  @Column({ type: DataType.STRING, primaryKey: true, allowNull: false })
  test_category: string; // e.g., 'BMI', 'BP', 'RBS'

  // Stores all condition-to-S3-URL mappings
  @Column({ 
    type: DataType.JSONB, // Use JSONB for better performance and indexing (if available in your dialect)
    allowNull: false,
    defaultValue: {} 
  })
  video_links: VideoLinksMap;


}