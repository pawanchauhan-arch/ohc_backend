import { Injectable, Logger } from '@nestjs/common';
import { MigrationSource, MigrationConfig } from '../config/migration.config';
import { getMigrationConfig } from '../config/migration.config';

/**
 * Service responsible for managing multiple source database configurations
 * Handles source validation, connection testing, and configuration management
 */
@Injectable()
export class SourceConfigurationService {
  private readonly logger = new Logger(SourceConfigurationService.name);
  private readonly migrationConfig: MigrationConfig;

  constructor() {
    this.migrationConfig = getMigrationConfig();
  }

  /**
   * Gets all active migration sources
   */
  getActiveSources(): MigrationSource[] {
    return this.migrationConfig.sources.filter(source => source.isActive);
  }

  /**
   * Gets a specific source by name
   */
  getSourceByName(sourceName: string): MigrationSource | undefined {
    return this.migrationConfig.sources.find(
      source => source.name === sourceName && source.isActive
    );
  }

  /**
   * Gets all sources (active and inactive)
   */
  getAllSources(): MigrationSource[] {
    return this.migrationConfig.sources;
  }

  /**
   * Validates source configuration
   */
  validateSource(source: MigrationSource): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!source.name) {
      errors.push('Source name is required');
    }

    if (!source.database.host) {
      errors.push(`Database host is required for source ${source.name}`);
    }

    if (!source.database.port || source.database.port <= 0) {
      errors.push(`Valid database port is required for source ${source.name}`);
    }

    if (!source.database.database) {
      errors.push(`Database name is required for source ${source.name}`);
    }

    if (!source.database.username) {
      errors.push(`Database username is required for source ${source.name}`);
    }

    if (!source.database.password) {
      errors.push(`Database password is required for source ${source.name}`);
    }

    if (!source.creatorId || source.creatorId <= 0) {
      errors.push(`Valid creator ID is required for source ${source.name}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates all active sources
   */
  validateAllActiveSources(): { isValid: boolean; errors: string[]; sourceErrors: Record<string, string[]> } {
    const activeSources = this.getActiveSources();
    const errors: string[] = [];
    const sourceErrors: Record<string, string[]> = {};

    if (activeSources.length === 0) {
      errors.push('No active migration sources found');
      return { isValid: false, errors, sourceErrors };
    }

    for (const source of activeSources) {
      const validation = this.validateSource(source);
      if (!validation.isValid) {
        sourceErrors[source.name] = validation.errors;
        errors.push(`Source ${source.name}: ${validation.errors.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sourceErrors,
    };
  }

  /**
   * Gets source statistics
   */
  getSourceStatistics(): {
    totalSources: number;
    activeSources: number;
    inactiveSources: number;
    sourceDetails: Array<{ name: string; isActive: boolean; creatorId: number }>;
  } {
    const allSources = this.getAllSources();
    const activeSources = this.getActiveSources();

    return {
      totalSources: allSources.length,
      activeSources: activeSources.length,
      inactiveSources: allSources.length - activeSources.length,
      sourceDetails: allSources.map(source => ({
        name: source.name,
        isActive: source.isActive,
        creatorId: source.creatorId,
      })),
    };
  }

  /**
   * Checks if parallel processing is enabled
   */
  isParallelProcessingEnabled(): boolean {
    return this.migrationConfig.enableParallel;
  }

  /**
   * Gets parallel processing delay
   */
  getParallelDelay(): number {
    return this.migrationConfig.parallelDelay;
  }

  /**
   * Gets migration configuration
   */
  getMigrationConfig(): MigrationConfig {
    return this.migrationConfig;
  }
}
