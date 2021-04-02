"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const F = __importStar(require("../../../../node_modules/fp-ts/function"));
const TE = __importStar(require("../../../../node_modules/fp-ts/TaskEither"));
const google_sheet_to_dataset_1 = require("../../../infrastructure/service/dataset/google_sheet_to_dataset");
const dataset_service_error_1 = require("../../../infrastructure/error/dataset_service_error");
const dataset_file_1 = require("../../../infrastructure/service/dataset/dataset_file");
const DatasetMetadataEntity_1 = require("../../../infrastructure/entity/DatasetMetadataEntity");
const DatasetMetadataRepository_1 = require("../../../infrastructure/repository/DatasetMetadataRepository");
const error_1 = require("../../../infrastructure/error");
exports.default = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    yield F.pipe(google_sheet_to_dataset_1.uploadGoogleSpreadsheetAndParse(body.id), TE.chain((datasets) => {
        if (!datasets.length) {
            return TE.left(dataset_service_error_1.createDatasetServiceError(body.id, 'DOCUMENT_NOT_FOUND', 'No spreadsheets found'));
        }
        const createFileResults = datasets.map((dataset) => ({
            dataset,
            createResult: dataset_file_1.datasetWriteFile(dataset, true),
        }));
        if (createFileResults.some((x) => x.createResult._tag == 'Left')) {
            createFileResults
                .map((x) => x.createResult)
                .forEach((x) => {
                if (x._tag == 'Right') {
                    dataset_file_1.datasetDeleteFile(x.right);
                }
            });
            return TE.left(dataset_service_error_1.createDatasetServiceError(body.id, 'WRITE_FILE_ERROR', 'Can not save file'));
        }
        return TE.right(createFileResults.map((result) => {
            const path = result.createResult.right;
            const dataset = result.dataset;
            return {
                metadata: DatasetMetadataEntity_1.createDatasetMetadataEntity({
                    spreadsheetId: body.id,
                    columnsCount: dataset.body[0].length,
                    sourceType: 'GOOGLE_SHEETS',
                    name: dataset.name,
                    isTemporary: true,
                    outputsCount: 0,
                    inputsCount: 0,
                    source: path,
                    size: dataset.body.length,
                    type: '_table',
                }),
                dataset,
            };
        }));
    }), TE.chain((pairs) => TE.tryCatch(() => __awaiter(void 0, void 0, void 0, function* () {
        const models = [];
        for (const { dataset, metadata } of pairs) {
            const createResult = yield DatasetMetadataRepository_1.dbCreateDatasetMetadataEntity(metadata)();
            const examplesCount = Math.min(3, dataset.body.length);
            if (createResult._tag == 'Right') {
                models.push({
                    id: createResult.right.id,
                    name: metadata.name,
                    spreadsheetId: metadata.spreadsheetId,
                    sheetId: '',
                    columns: dataset.header.map((header, index) => {
                        return {
                            index,
                            originIndex: index,
                            name: header.title,
                            type: header.type,
                            decimals: header.decimals,
                            examples: [
                                ...Array(examplesCount).keys(),
                            ].map((i) => dataset.body[i][index].join(',')),
                        };
                    }),
                });
            }
        }
        return TE.right(models);
    }), (err) => error_1.createServiceError('UNEXPECTED_ERROR', String(err)))), TE.flatten, TE.fold((l) => {
        console.error('error', l);
        res.send(l);
        return null;
    }, (r) => {
        console.log(r);
        res.send(r);
        return null;
    }))();
});
//# sourceMappingURL=create_googlesheets.js.map