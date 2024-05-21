"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesNodeNameFitRegex = void 0;
const caller_configuration_parser_1 = require("./caller-configuration-parser");
/**
 * node name이 사용자에게서 받은 regex에 걸리는지 확인합니다.
 * */
const doesNodeNameFitRegex = (schemaNodeName) => {
    const customMapScalarName = caller_configuration_parser_1.configuration['node-name-regexes-to-exclude'];
    if (!customMapScalarName || customMapScalarName.length === 0) {
        return false;
    }
    const regexes = customMapScalarName.map((regex) => new RegExp(regex));
    return regexes.some((regex) => regex.test(schemaNodeName));
};
exports.doesNodeNameFitRegex = doesNodeNameFitRegex;
