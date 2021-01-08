// import { AppError, createAppError } from '@/infrastructure/core';
// import { AppDataset, AppDatasetCol, EnumAppDatasetDataType, EnumAppDatasetSource, parseDataToColValues } from '@/infrastructure/dataset';
// import { SourceGoogleScheetColScheme, SourceGoogleSheet, SourceGoogleSheetScheme, SourceGoogleWorksheetCol } from '.';
// import * as E from 'fp-ts/Either';
// import * as F from 'fp-ts/function';
// import * as IM from '@/infrastructure/core/IndexedMap';
// import moment from 'moment';
//
// type _SchemeBundle = {
//   scheme: SourceGoogleSheetScheme;
//   source: SourceGoogleSheet;
// };
//
// const validateSourceGoogleScheetScheme = (scheme: SourceGoogleSheetScheme): E.Either<AppError, SourceGoogleSheetScheme> => {
//   if (!scheme) return E.left(createAppError({ message: 'Scheme is null' }));
//   if (!scheme.sheets || !IM.getEntities(scheme.sheets).length) return E.left(createAppError({ message: 'Scheme do not contains sheets' }));
//   return E.right(scheme);
// };
//
// export const googleSheetToSource = (scheme: SourceGoogleSheetScheme) => (source: SourceGoogleSheet): E.Either<AppError, AppDataset[]> =>
//   F.pipe(
//     scheme,
//     validateSourceGoogleScheetScheme,
//     E.chain(_scheme => F.pipe(
//       source,
//       E.fromNullable(createAppError({ message: 'Google source is null' })),
//       E.map((gs) => ({
//         scheme: _scheme,
//         source: gs
//       }) as _SchemeBundle)
//     )),
//     E.chain((payload) => E.tryCatch(
//       () => {
//         const appDatasets = [] as AppDataset[];
//         for (const { key, value } of IM.getEntities(payload.scheme.sheets)) {
//           const currentWorksheet = payload.source.worksheets[key];
//           const colIndexesToParse = IM.getValues(value.cols).filter(x => x.isInclude).map(col => col.originIndex);
//           F.pipe(
//             currentWorksheet.cols,
//             IM.filterByValue((x: SourceGoogleWorksheetCol) => colIndexesToParse.indexOf(x.originalIndex) != -1),
//             (rawKeyColumns) => {
//               const columns = rawKeyColumns.map(x => x.value);
//               appDatasets.push({
//                 dataType: EnumAppDatasetDataType.table,
//                 sourceId: payload.source.id,
//                 id: currentWorksheet.id,
//                 createdTime: moment.utc().unix(),
//                 lastSyncTime: moment.utc().unix(),
//                 sourceIndex: currentWorksheet.index,
//                 source: EnumAppDatasetSource.googleSpreadsheet,
//                 name: value.name,
//                 processType: value.type,
//                 cols: columns.map(sourceColumn => {
//                   const schemeColumn = IM.filterByKey<SourceGoogleScheetColScheme>(x => x == sourceColumn.originalIndex)(value.cols)[0].value;
//                   return {
//                     id: String(sourceColumn.originalIndex),
//                     isOutput: schemeColumn.isOutput,
//                     originalIndex: schemeColumn.originIndex,
//                     size: sourceColumn.values.length,
//                     title: sourceColumn.title,
//                     type: schemeColumn.colType,
//                     decimals: schemeColumn.decimals,
//                     data: [...parseDataToColValues(schemeColumn.colType, schemeColumn.decimals)(sourceColumn.values)]
//                     // data: [...parseDataToColValues(schemeColumn.colType, schemeColumn.decimals)(sourceColumn.values)].map(x => ({
//                     //   value: Object(x)
//                     // }) as AppDatasetCell)
//                   } as AppDatasetCol;
//                 })
//               } as AppDataset);
//             }
//           );
//         }
//
//         return appDatasets;
//       },
//       (reason) => createAppError({ message: String(reason) })
//     )));