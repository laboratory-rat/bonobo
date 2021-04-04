/**
 * Dataset tools package
 * 
 * @packageDocumentation AppDataset
 * @module AppDataset
 */

import { KeyLabelStringIterable } from '../core';

/**
 * What source used to create this dataset
 */
export enum EnumAppDatasetMetadataSourceType {
  GOOGLE_WORKSHEET = 'GOOGLE_WORKSHEET',
  UPLOADED_FILE = 'UPLOADED_FILE'
}

/**
 * Transform value to string representation
 * @param value
 */
export const enumAppDatasetMetadataSourceTypeToString = (value: EnumAppDatasetMetadataSourceType): string => {
  switch (value) {
    case EnumAppDatasetMetadataSourceType.GOOGLE_WORKSHEET:
      return 'Google worksheet';
    case EnumAppDatasetMetadataSourceType.UPLOADED_FILE:
      return 'Uploaded file';
    default:
      return String(value);
  }
};

/**
 * Dataset cell content
 */
export enum EnumAppDatasetMetadataColType {
  NUMBER_ARRAY = 'NUMBER_ARRAY',
  STRING_ARRAY = 'STRING_ARRAY'
}

/**
 * Transform value to string representation
 * @param value
 */
export const enumAppDatasetMetadataColTypeToString = (value: EnumAppDatasetMetadataColType): string => {
  switch (value) {
    case EnumAppDatasetMetadataColType.NUMBER_ARRAY:
      return 'Number array';
    case EnumAppDatasetMetadataColType.STRING_ARRAY:
      return 'String array';
    default:
      return String(value);
  }
};

/**
 * Selectable list for dataset process types
 */
export const enumAppDatasetColTypeList = (): KeyLabelStringIterable<EnumAppDatasetMetadataColType>[] => [
  {
    key: EnumAppDatasetMetadataColType.STRING_ARRAY,
    label: enumAppDatasetMetadataColTypeToString(EnumAppDatasetMetadataColType.STRING_ARRAY)
  },
  {
    key: EnumAppDatasetMetadataColType.NUMBER_ARRAY,
    label: enumAppDatasetMetadataColTypeToString(EnumAppDatasetMetadataColType.NUMBER_ARRAY)
  },
];

/**
 * In what operations dataset will be used
 */
export enum EnumAppDatasetMetadataProcessType {
  training = 'TRAINING',
  validation = 'VALIDATION',
  prediction = 'PREDICTION'
}

/**
 * Transform value to string representation
 * @param value
 */
export const enumAppDatasetTypeToString = (value: EnumAppDatasetMetadataProcessType): string => {
  switch (value) {
    case EnumAppDatasetMetadataProcessType.training:
      return 'Training';
    case EnumAppDatasetMetadataProcessType.prediction:
      return 'Prediction';
    case EnumAppDatasetMetadataProcessType.validation:
      return 'Validation';
    default:
      return String(value);
  }
};

/**
 * Selectable list for dataset process types
 */
export const enumAppDatasetTypeList = (): KeyLabelStringIterable<EnumAppDatasetMetadataProcessType>[] => [
  {
    key: EnumAppDatasetMetadataProcessType.prediction,
    label: enumAppDatasetTypeToString(EnumAppDatasetMetadataProcessType.prediction)
  },
  {
    key: EnumAppDatasetMetadataProcessType.training,
    label: enumAppDatasetTypeToString(EnumAppDatasetMetadataProcessType.training)
  },
  {
    key: EnumAppDatasetMetadataProcessType.validation,
    label: enumAppDatasetTypeToString(EnumAppDatasetMetadataProcessType.validation)
  },
];

