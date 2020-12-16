/**
 * Dataset tools package
 * 
 * @packageDocumentation AppDataset
 * @module AppDataset
 */

import { KeyLabelStringIterable } from '../core';

export enum EnumAppDatasetProcessType {
  training = 'TRAINING',
  validation = 'VALIDATION',
  prediction = 'PREDICTION'
}

export const enumAppDatasetTypeToString = (value: EnumAppDatasetProcessType) => {
  switch (value) {
    case EnumAppDatasetProcessType.training:
      return 'Training';
    case EnumAppDatasetProcessType.prediction:
      return 'Prediction';
    case EnumAppDatasetProcessType.validation:
      return 'Validation';
    default:
      throw 'Wrong app dataset type';
  }
};

export const enumAppDatasetTypeList = (): KeyLabelStringIterable<EnumAppDatasetProcessType>[] => [
  {
    key: EnumAppDatasetProcessType.prediction,
    label: enumAppDatasetTypeToString(EnumAppDatasetProcessType.prediction)
  },
  {
    key: EnumAppDatasetProcessType.training,
    label: enumAppDatasetTypeToString(EnumAppDatasetProcessType.training)
  },
  {
    key: EnumAppDatasetProcessType.validation,
    label: enumAppDatasetTypeToString(EnumAppDatasetProcessType.validation)
  },
];


export enum EnumAppDatasetSource {
  googleSpreadsheet = 'GOOGLE_SPREADSHEET',
  csv = 'CSV',
  xls = 'XLS'
}

export enum EnumAppDatasetColType {
  category = 'CATEGORY',
  number = 'NUMBER',
  sequenceCategory = 'SEQUENCE_CATEGORY',
  sequenceNumber = 'SEQUENCE_NUMBER',
}

export const enumAppDatasetColTypeToString = (value: EnumAppDatasetColType) => {
  switch (value) {
    case EnumAppDatasetColType.category:
      return 'Category';
    case EnumAppDatasetColType.number:
      return 'Number';
    case EnumAppDatasetColType.sequenceCategory:
      return 'Sequence Category';
    case EnumAppDatasetColType.sequenceNumber:
      return 'Sequence Number';
    default:
      throw 'Wrong app dataset col type';
  }
};

export const enumAppDatasetColTypeList = (): KeyLabelStringIterable<EnumAppDatasetColType>[] => [
  {
    key: EnumAppDatasetColType.number,
    label: enumAppDatasetColTypeToString(EnumAppDatasetColType.number)
  },
  {
    key: EnumAppDatasetColType.category,
    label: enumAppDatasetColTypeToString(EnumAppDatasetColType.category)
  },
  {
    key: EnumAppDatasetColType.sequenceCategory,
    label: enumAppDatasetColTypeToString(EnumAppDatasetColType.sequenceCategory)
  },
  {
    key: EnumAppDatasetColType.sequenceNumber,
    label: enumAppDatasetColTypeToString(EnumAppDatasetColType.sequenceNumber)
  },
];

export enum EnumAppDatasetDataType {
  table = 'TABLE',
  images = 'IMAGES'
}

export const enumAppDatasetDataTypeToString = (value: EnumAppDatasetDataType) => {
  switch (value) {
    case EnumAppDatasetDataType.table:
      return 'Table';
    case EnumAppDatasetDataType.images:
      return 'Images';
    default:
      return 'Unknown';
  }
};

