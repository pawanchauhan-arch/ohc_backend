export class ConcernDto {
  id: string;
  type: string;
  level: 'MODERATE' | 'HIGH';
  parameter: string;
  value: number | string;
  threshold: number | string;
  recommendation: string;
}

export class AnalysisSummaryDto {
  totalConcerns: number;
  moderateCount: number;
  highCount: number;
}

export class AnalysisResultDto {
  success: boolean;
  concerns: ConcernDto[];
  summary: AnalysisSummaryDto;
}
