"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegexFilteredSchema = exports.checkIfInputToExclude = void 0;
const caller_configuration_parser_1 = require("./caller-configuration-parser");
const checkIfInputToExclude = (schemaNodeName) => {
    const customMapScalarName = caller_configuration_parser_1.configuration['node-name-regexes-to-exclude'];
    if (!customMapScalarName || customMapScalarName.length === 0) {
        return false;
    }
    const regexes = customMapScalarName.map((regex) => new RegExp(regex));
    return regexes.some((regex) => regex.test(schemaNodeName));
};
exports.checkIfInputToExclude = checkIfInputToExclude;
const getRegexFilteredSchema = (schemaNodeNamesToExclude, schema) => {
    let filteredSchema = schema;
    filteredSchema = replaceExcludedInputsFromSchema(schemaNodeNamesToExclude, filteredSchema);
    filteredSchema = addCustomScalar(filteredSchema);
    return filterRegex(schemaNodeNamesToExclude, filteredSchema);
};
exports.getRegexFilteredSchema = getRegexFilteredSchema;
/* -------------------------------------------------------------------------- */
/*                              Private Functions                             */
/* -------------------------------------------------------------------------- */
const filterRegex = (schemaNodeNamesToExclude, schema) => {
    const modifiedText = schema.split('\n\n').map(typeDef => {
        const nodeName = typeDef.match(/input\s+(\w+)\s*\{/)?.[1];
        return nodeName && schemaNodeNamesToExclude.includes(nodeName) ? `` : typeDef;
    }).join('\n\n');
    return modifiedText;
};
const replaceExcludedInputsFromSchema = (schemaNodeNamesToExclude, filteredSchema) => {
    let arrangedSchema = filteredSchema;
    const customMapScalarName = caller_configuration_parser_1.configuration['replacing-custom-scalar-name'];
    if (customMapScalarName === undefined || customMapScalarName === '') {
        return arrangedSchema;
    }
    schemaNodeNamesToExclude.forEach((schemaNodeName) => {
        arrangedSchema = arrangedSchema.replaceAll(`: ${schemaNodeName}`, `: ${customMapScalarName}`);
        arrangedSchema = arrangedSchema.replaceAll(`: [${schemaNodeName}`, `: [${customMapScalarName}`);
    });
    return arrangedSchema;
};
const addCustomScalar = (schema) => {
    const customMapScalarName = caller_configuration_parser_1.configuration['replacing-custom-scalar-name'];
    if (customMapScalarName === undefined || customMapScalarName === '') {
        return schema;
    }
    return schema + `\n\nscalar ${customMapScalarName}\n`;
};
