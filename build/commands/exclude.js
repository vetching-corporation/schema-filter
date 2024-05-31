"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excludeOperation = void 0;
const assert_1 = __importDefault(require("assert"));
const chalk_1 = __importDefault(require("chalk"));
const excludeOperation = (operationName) => {
    (0, assert_1.default)(operationName !== undefined, 'operation name is required');
    console.log('including', operationName);
    console.log(chalk_1.default.yellowBright(`not implemented yet, sorry`));
    process.exit();
};
exports.excludeOperation = excludeOperation;
