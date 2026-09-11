/**
 * Health Test Models Export Index
 * Exports all health test models for easy importing
 */

// Import all model classes
import { Spo2Test } from './Spo2Test';
import { BloodPressureTest } from './BloodPressureTest';
import { TemperatureTest } from './TemperatureTest';
import { PulseTest } from './PulseTest';
import { BmiTest } from './BmiTest';
import { RandomBloodSugarTest } from './RandomBloodSugarTest';
import { HaemoglobinTest } from './HaemoglobinTest';
import { AlcoholTest } from './AlcoholTest';
import { EcgTest } from './EcgTest';
import { VisionTest } from './VisionTest';
import { RombergTest } from './RombergTest';
import { PulmonaryFunctionTest } from './PulmonaryFunctionTest';
import { HivTest } from './HivTest';
import { EyeTest } from './EyeTest';

// Export all models
export { 
  Spo2Test, 
  BloodPressureTest, 
  TemperatureTest, 
  PulseTest, 
  BmiTest, 
  RandomBloodSugarTest, 
  HaemoglobinTest, 
  AlcoholTest, 
  EcgTest, 
  VisionTest, 
  RombergTest, 
  PulmonaryFunctionTest, 
  HivTest, 
  EyeTest 
};

/**
 * Array of all health test model classes for easy iteration
 */
export const ALL_HEALTH_TEST_MODELS = [
  Spo2Test,
  BloodPressureTest,
  TemperatureTest,
  PulseTest,
  BmiTest,
  RandomBloodSugarTest,
  HaemoglobinTest,
  AlcoholTest,
  EcgTest,
  VisionTest,
  RombergTest,
  PulmonaryFunctionTest,
  HivTest,
  EyeTest,
] as const;

/**
 * Type for all health test model instances
 */
export type HealthTestModel = 
  | Spo2Test
  | BloodPressureTest
  | TemperatureTest
  | PulseTest
  | BmiTest
  | RandomBloodSugarTest
  | HaemoglobinTest
  | AlcoholTest
  | EcgTest
  | VisionTest
  | RombergTest
  | PulmonaryFunctionTest
  | HivTest
  | EyeTest;
