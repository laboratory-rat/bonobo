"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const create_googlesheets_1 = __importDefault(require("./create_googlesheets"));
const express_1 = require("express");
const body_parser_1 = require("body-parser");
const router = express_1.Router();
router.post('/create/google_sheet', body_parser_1.json(), create_googlesheets_1.default);
router.get('/dummy', (req, res) => {
    res.send('Dummy!');
});
exports.default = router;
//# sourceMappingURL=index.js.map