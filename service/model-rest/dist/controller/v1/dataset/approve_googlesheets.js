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
const E = __importStar(require("../../../../node_modules/fp-ts/Either"));
const error_1 = require("../../../infrastructure/error");
const DatasetMetadataRepository_1 = require("../../../infrastructure/repository/DatasetMetadataRepository");
const dataset_file_1 = require("../../../infrastructure/service/dataset/dataset_file");
exports.default = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    yield F.pipe(body, E.fromNullable(error_1.createServiceError('BAD_MODEL', 'Model is null')), TE.fromEither, TE.chain((model) => F.pipe(DatasetMetadataRepository_1.dbReadDatasetMetadataEntity(body.id), TE.map((entity) => ({ entity, model })))), TE.chain((pair) => F.pipe(dataset_file_1.datasetReadFile(pair.entity.source), TE.fromEither, TE.map((dataset) => (Object.assign(Object.assign({}, pair), { dataset }))))));
});
//# sourceMappingURL=approve_googlesheets.js.map