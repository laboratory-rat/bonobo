// /**
//  * Dataset tools package
//  *
//  * @packageDocumentation AppDataset
//  * @module AppDataset
//  */
//
// import { EnumAppDatasetMetadataProcessType } from '../dataset';
// import { IndexedMap } from '../core/IndexedMap';
// import { AppError, createAppError } from '../core';
// import * as E from 'fp-ts/Either';
// import * as IM from '@/infrastructure/core/IndexedMap';
//
// /**
//  * Data table serializable type
//  * Main data type in application
//  *
//  * @interface
//  */
// export interface AppDataset {
//   /** Dataset id */
//   id: string;
//
//   /** Dataset name */
//   name: string;
//
//   /** Index from source dataset (worksheet index) */
//   sourceIndex: number;
//
//   /** Dataset columns */
//   cols: IndexedMap<AppDatasetCol>;
//
//   /** Last synced tyme (for third party sources) */
//   lastSyncTime: number;
//
//   /** Time when dataset created */
//   createdTime: number;
//
//   /** Source type */
//   source: EnumAppDatasetSource;
//
//   /** Source id (if exists) */
//   sourceId?: string;
//
//   /** How to work with this dataset */
//   processType: EnumAppDatasetMetadataProcessType;
//
//   /** Type of information inside dataset (image/table) */
//   dataType: EnumAppDatasetDataType;
// }
//
// /**
//  * App dataset column
//  *
//  * @interface
//  */
// export interface AppDatasetCol {
//   /** Index in original data source */
//   originalIndex: number;
//
//   /** Title */
//   title: string;
//
//   /** Column id (index) */
//   id: string;
//
//   /** Is this column usable as output */
//   isOutput: boolean;
//
//   /** Data type in this column */
//   type: EnumAppDatasetColType;
//
//   /** Size (length) of this column */
//   size: number;
//
//   /** Data */
//   data: AppDataCellValueType[];
//
//   /** If type is numeric - round values to point */
//   decimals?: number;
// }
//
// /**
//  * App dataset cell value
//  *
//  * @interface
//  */
// export interface AppDatasetCell {
//   /** Value inside this cell */
//   value: string | string[] | number | number[];
// }
//
// /**
//  * Available dataset cell data types
//  */
// export type AppDataCellValueType = string | number | string[] | number[];
//
// /**
//  * App dataset cell data after read
//  */
// export type AppDataCellValueTensorType = number[] | string[];
//
// /**
//  * Read column`s value by index and returns in representation
//  *
//  * @function
//  * @param {CellSelect} payload
//  * @return {AppDataCellValueTensorType}
//  */
// const readDataCellTensorValue = (payload: { col: AppDatasetCol; index: number }): AppDataCellValueTensorType => {
//   const value = payload.col.data[payload.index];
//   switch (payload.col.type) {
//     case EnumAppDatasetColType.category:
//       return [String(value)];
//     case EnumAppDatasetColType.number:
//       return [Number(value)];
//     case EnumAppDatasetColType.sequenceCategory:
//       return (value as string[]);
//     case EnumAppDatasetColType.sequenceNumber:
//       return (value as number[]);
//     default:
//       throw 'Impossible error';
//   }
// };
//
// /**
//  * Create dataset read delegate
//  *
//  * @param {number} index - Target index
//  * @return {AppDatasetReadDelegate}
//  */
// export const readDatasetRow = (index: number) => (dataset: AppDataset): E.Either<AppError, { input: (string | number)[]; output: (string | number)[] }> =>
//   E.tryCatch(
//     () => ({
//       input: [
//         ...(IM.filterByValue<AppDatasetCol>(x => !x.isOutput)(dataset.cols)
//           .map(({ value }) => readDataCellTensorValue({ col: value, index: index }))
//           .flat())
//       ],
//       output: [
//         ...(IM.filterByValue<AppDatasetCol>(x => x.isOutput)(dataset.cols)
//           .map(({ value }) => readDataCellTensorValue({ col: value, index: index }))
//           .flat())
//       ]
//     }),
//     (reason) => createAppError({ message: String(reason) })
//   );
//
// /**
//  * Read all data from column
//  *
//  * @param col - App dataset col
//  */
// export const readColData = (col: AppDatasetCol): { size: number; data: AppDataCellValueType[] } => {
//   const parseCellValue = (cell: AppDataCellValueType) => {
//     switch (col.type) {
//       case EnumAppDatasetColType.number:
//         return Number(Number(cell).toFixed(col.decimals));
//       case EnumAppDatasetColType.category:
//         return String(cell);
//       case EnumAppDatasetColType.sequenceCategory:
//         return cell as string[];
//       case EnumAppDatasetColType.sequenceNumber:
//         return cell as number[];
//     }
//   };
//
//   const filtered = col.data
//     ?.filter(x => x != null)
//     .map(parseCellValue) || [];
//
//
//   return {
//     data: filtered,
//     size: filtered.length,
//   };
// };
//
// /**
//  * Create data parse delegate
//  *
//  * @function
//  * @param {EnumAppDatasetColType} type - Data type
//  * @param {number | null} decimals - Round to decimals (for numbers only)
//  */
// export const parseDataToColValues = (type: EnumAppDatasetColType, decimals: number | null) => (data: unknown[]): AppDataCellValueType[] => {
//   switch (type) {
//     case EnumAppDatasetColType.number:
//       return data.map(Number).map(x => x.toFixed(decimals ?? 2))
//         .map(Number);
//     case EnumAppDatasetColType.category:
//       return data.map(String);
//     case EnumAppDatasetColType.sequenceCategory:
//       return data.map(x => JSON.parse(String(x)) as string[]);
//     case EnumAppDatasetColType.sequenceNumber:
//       return data.map(x => JSON.parse(String(x)) as string[])
//         .map(Number)
//         .map(x => x.toFixed(decimals ?? 2))
//         .map(Number);
//     default:
//       throw 'Impossible error';
//   }
// };
//
// /**
//  * Input / Output tuple
//  *
//  * @typedef InputOutputTuple
//  * @prop {Array.<string | number>} input
//  * @prop {Array.<string | number>} output
//  */
//
// /**
//  * Target column and cell index
//  *
//  * @typedef {object} CellSelect
//  * @prop {AppDatasetCol} col
//  * @prop {number} index
//  */
//
// /**
//  * Dataset read delegate
//  *
//  * @typedef {object} AppDatasetReadDelegate
//  * @param {AppDataset} dataset - Dataset to read
//  * @return {E.Either<AppError, InputOutputTuple>}
//  */