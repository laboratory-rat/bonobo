/**
 * Dataset tools package
 * 
 * @packageDocumentation
 * @module AppDataset
 */

import {
  EnumAppDatasetMetadataColType,
  EnumAppDatasetMetadataProcessType,
  EnumAppDatasetMetadataSourceType
} from './enums';

/**
 * App metadata from BE
 */
export interface AppDatasetMetadata {
  id: string;
  name: string;
  userID: string;
  header: AppDatasetMetadataHeader[];
  examples: AppDatasetMetadataCol[];
  size: number;
  datasetProcessType: EnumAppDatasetMetadataProcessType;
  datasetReference: string;
  sourceType: EnumAppDatasetMetadataSourceType;
  sourceReference: string;
  isTemporary: boolean;
  isArchived: boolean;
  createdTime: number;
  updatedTime: number;
  lastSyncTime?: number;
  archivedTime?: number;
}

/**
 * Metadata header
 * Present column types and names
 */
export interface AppDatasetMetadataHeader {
  title: string;
  index: number;
  decimals: number;
  originIndex: number;
  type: EnumAppDatasetMetadataColType;
  isOutput: boolean;
}

export interface AppDatasetMetadataCol {
  value: AppDatasetMetadataCell[];
}

export interface AppDatasetMetadataCell {
  value: unknown[];
}

/**
 * AppDatasetMetadataApprove
 * Approve created metadata
 */
export interface AppDatasetMetadataApprove {
  name: string;
  header: AppDatasetMetadataHeader[];
}
