import {AppDatasetMetadataHeader} from '@/infrastructure/dataset/AppDatasetMetadata';
import { EnumAppDatasetMetadataColType, EnumAppDatasetMetadataProcessType } from '@/infrastructure/dataset/enums';

/**
 * DB stored app dataset representation.
 */
export interface AppDataset {
  id: string;
  name: string;
  metadataID: string;
  userID: string;
  header: AppDatasetMetadataHeader[];
  body: unknown[][][];
  createdTime: number;
  updatedTime: number;
}

/**
 * Model for approving dataset.
 * Set if from temporary to stored state.
 * {@see AppDataset}
 */
export interface AppDatasetApprove {
  name: string;
  datasetProcessType: EnumAppDatasetMetadataProcessType;
  header: AppDatasetApproveHeader[];
}

/**
 * Header of exists column.
 * Provide only headers want to include to the final revision of {@see AppDataset}.
 */
export interface AppDatasetApproveHeader {
  originIndex: number;
  index: number;
  title: string;
  decimals: number;
  colType: EnumAppDatasetMetadataColType;
  isOutput: boolean;
}
