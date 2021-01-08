import { EnumAppDatasetColType, EnumAppDatasetMetadataProcessType } from '@/infrastructure/dataset';
import * as IM from '@/infrastructure/core/IndexedMap';

export interface SourceGoogleSheetScheme {
  sheets: IM.IndexedMap<SourceGoogleSheetWorksheetScheme>;
}

export interface SourceGoogleSheetWorksheetScheme {
  cols: IM.IndexedMap<SourceGoogleScheetColScheme>;
  type: EnumAppDatasetMetadataProcessType;
  name: string;
}

export interface SourceGoogleScheetColScheme {
  title: string;
  isInclude: boolean;
  colIndex: number;
  originIndex: number;
  colType: EnumAppDatasetColType;
  isOutput: boolean;
  decimals: number | null;
  preview: unknown[];
}
