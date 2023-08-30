"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFilters = void 0;
const fs_1 = require("fs");
const graphql_1 = require("graphql");
const path = __importStar(require("path/posix"));
const console_1 = require("console");
const lodash_1 = require("lodash");
const caller_configuration_parser_1 = require("../utilities/caller-configuration-parser");
const operation_loader_1 = require("../utilities/operation-loader");
const isTypeSystemExtensionNode = (node) => {
    return (node.kind === graphql_1.Kind.SCHEMA_EXTENSION ||
        node.kind === graphql_1.Kind.SCALAR_TYPE_EXTENSION ||
        node.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION ||
        node.kind === graphql_1.Kind.INTERFACE_TYPE_EXTENSION ||
        node.kind === graphql_1.Kind.UNION_TYPE_EXTENSION ||
        node.kind === graphql_1.Kind.ENUM_TYPE_EXTENSION ||
        node.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_EXTENSION);
};
const isExecutableDefinitionNode = (node) => {
    return node.kind === graphql_1.Kind.OPERATION_DEFINITION || node.kind === graphql_1.Kind.FRAGMENT_DEFINITION;
};
const isTypeSystemDefinitionNode = (node) => {
    return (node.kind === graphql_1.Kind.SCHEMA_DEFINITION ||
        node.kind === graphql_1.Kind.SCALAR_TYPE_DEFINITION ||
        node.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
        node.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION ||
        node.kind === graphql_1.Kind.UNION_TYPE_DEFINITION ||
        node.kind === graphql_1.Kind.ENUM_TYPE_DEFINITION ||
        node.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION ||
        node.kind === graphql_1.Kind.DIRECTIVE_DEFINITION);
};
const loadExistingOperationFilterMap = () => {
    const currentInUseOperationMap = new Map();
    const queries = (0, operation_loader_1.loadQueries)();
    const mutations = (0, operation_loader_1.loadMutations)();
    const subscriptions = (0, operation_loader_1.loadSubscriptions)();
    const operations = [...queries, ...mutations, ...subscriptions];
    operations.forEach((operation) => currentInUseOperationMap.set(operation.name, operation.inUse));
    return currentInUseOperationMap;
};
const initializeFilters = () => {
    const originalSchema = (0, fs_1.readFileSync)(caller_configuration_parser_1.cofiguration['schema-original'], 'utf-8');
    const ast = (0, graphql_1.parse)(originalSchema);
    const outputPath = caller_configuration_parser_1.cofiguration['filters'];
    if (!(0, fs_1.existsSync)(outputPath)) {
        (0, fs_1.mkdirSync)(outputPath);
    }
    /// Where we start traversing
    /// and how to get actual graphql operations
    const fieldLevelLookUpTypeNames = new Set(['Query', 'Mutation', 'Subscription']);
    const isOperationInUse = loadExistingOperationFilterMap();
    /// used to log
    const kindCounts = new Map();
    /**
     * Query, Mutation, Subscription 목록을 가져오자.
     */
    const lookForExecutableDefinitionNodes = (ast) => {
        const definitionNodes = ast.definitions;
        for (let index = 0; index < definitionNodes.length; index++) {
            const definitionNode = definitionNodes.at(index);
            (0, console_1.assert)(!!definitionNode, 'definitionNode not found');
            kindCounts.set(definitionNode.kind, (kindCounts.get(definitionNode.kind) ?? 0) + 1);
            if (isTypeSystemExtensionNode(definitionNode)) {
                continue;
            }
            if (isExecutableDefinitionNode(definitionNode)) {
                continue;
            }
            if (isTypeSystemDefinitionNode(definitionNode)) {
                // we're only looking for query, mutation, subscription!
                switch (definitionNode.kind) {
                    case graphql_1.Kind.SCHEMA_DEFINITION:
                    case graphql_1.Kind.SCALAR_TYPE_DEFINITION:
                    case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
                    case graphql_1.Kind.UNION_TYPE_DEFINITION:
                    case graphql_1.Kind.ENUM_TYPE_DEFINITION:
                    case graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION:
                    case graphql_1.Kind.DIRECTIVE_DEFINITION:
                        continue;
                    case graphql_1.Kind.OBJECT_TYPE_DEFINITION:
                        const typeName = definitionNode.name.value;
                        if (fieldLevelLookUpTypeNames.has(typeName)) {
                            const operationInUse = [];
                            definitionNode.fields?.forEach((field) => {
                                const fieldName = field.name.value;
                                const batchSettingToUse = caller_configuration_parser_1.cofiguration['batch-setting'][(0, lodash_1.lowerCase)(typeName)];
                                operationInUse.push({
                                    inUse: isOperationInUse.has(fieldName) ? isOperationInUse.get(fieldName) : batchSettingToUse,
                                    name: fieldName,
                                });
                            });
                            (0, fs_1.writeFileSync)(path.join(outputPath, `${typeName}.json`), JSON.stringify(operationInUse, undefined, 2));
                        }
                }
            }
        }
    };
    lookForExecutableDefinitionNodes(ast);
};
exports.initializeFilters = initializeFilters;
