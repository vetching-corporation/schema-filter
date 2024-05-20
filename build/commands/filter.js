"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filter = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const graphql_1 = require("graphql");
const ast_filter_1 = require("../utilities/ast-filter");
const caller_configuration_parser_1 = require("../utilities/caller-configuration-parser");
const edge_generator_1 = require("../utilities/edge-generator");
const node_generator_1 = require("../utilities/node-generator");
const operation_filter_1 = require("../utilities/operation-filter");
const schema_regex_filter_1 = require("../utilities/schema-regex-filter");
const chalk_1 = __importDefault(require("chalk"));
// Located here due to stack overflow error due to large schema
const visitedIds = new Set();
let edges = new Map();
let schemaNodeById = new Map();
let schemaNodeIdByName = new Map();
let schemaNodeIdsToExclude = new Set();
const dfs = ({ schemaNodeId, depth, verbose = false }) => {
    visitedIds.add(schemaNodeId);
    const visitedNodeName = schemaNodeById.get(schemaNodeId).name;
    if (verbose)
        console.log(' '.repeat(depth) + visitedNodeName);
    if ((0, schema_regex_filter_1.checkIfInputToExclude)(visitedNodeName)) {
        schemaNodeIdsToExclude.add(schemaNodeId);
        visitedIds.delete(schemaNodeId);
        return;
    }
    const children = edges.get(schemaNodeId);
    (0, assert_1.default)(children !== undefined, `${visitedNodeName} has no children`);
    if (children.size > 0) {
        schemaNodeIdsToExclude.delete(schemaNodeId);
        children.forEach((child) => {
            schemaNodeIdsToExclude.delete(child);
            if (!visitedIds.has(child)) {
                dfs({
                    //
                    schemaNodeId: child,
                    depth: depth + 1,
                    verbose,
                });
            }
        });
    }
};
const findAllReachableSchemaNodeIds = ({ startingSchemaNodeNames }) => {
    if (startingSchemaNodeNames.includes('Mutation') && caller_configuration_parser_1.configuration['node-name-regexes-to-exclude'].length === 0) {
        console.log(chalk_1.default.yellow('[WARNING] Filter option includes Mutation, however, \'node-name-regexes-to-exclude\' is not provided or empty in package.json.\n', 'This may lead to unexpected stack overflow.'));
    }
    startingSchemaNodeNames.forEach((startingSchemaNodeName) => {
        dfs({
            //
            schemaNodeId: schemaNodeIdByName.get(startingSchemaNodeName),
            depth: 0,
        });
    });
    const visitedAllIds = Array.from(new Set([...visitedIds, ...schemaNodeIdsToExclude]));
    return new Set(visitedAllIds.map((visitedId) => schemaNodeById.get(visitedId).name));
};
const filter = () => {
    /* -------------------------------------------------------------------------- */
    /*                                 Entry Point                                */
    /* -------------------------------------------------------------------------- */
    const originalSchemaPath = caller_configuration_parser_1.configuration['schema-original'];
    const originalSchema = (0, fs_1.readFileSync)(originalSchemaPath, 'utf-8');
    const originalAST = (0, graphql_1.parse)(originalSchema);
    /* -------------------------------------------------------------------------- */
    /*                             Operation Filtering                            */
    /* -------------------------------------------------------------------------- */
    /**
     * - type Query
     * - type Mutation
     * - type Subscription
     *
     * 위 3개의 블록에서 원하는 줄만 남기고 삭제한다.
     */
    const operationFilteredAST = (0, operation_filter_1.filterOperationsToUse)(originalAST);
    const nodes = (0, node_generator_1.generateNodes)(operationFilteredAST);
    schemaNodeById = nodes.schemaNodeById;
    schemaNodeIdByName = nodes.schemaNodeIdByName;
    edges = (0, edge_generator_1.generateEdges)({
        ast: operationFilteredAST,
        schemaNodeIdByName,
    });
    /* -------------------------------------------------------------------------- */
    /*                          Traversing (Visit Check)                          */
    /* -------------------------------------------------------------------------- */
    /**
     * Starting from [Query, Mutation, Subscription], Traverse
     */
    const startingSchemaNodeNames = ['Query', 'Mutation', 'Subscription'];
    const visitedSchemaNodeNames = findAllReachableSchemaNodeIds({
        startingSchemaNodeNames,
    });
    /**
     * Output
     */
    console.log('schemaNodesToExclude count =', schemaNodeIdsToExclude.size);
    const schemaNodeNamesToExclude = Array.from(schemaNodeIdsToExclude).map((id) => schemaNodeById.get(id).name);
    const filteredAST = (0, ast_filter_1.filterOnlyVisitedSchema)(operationFilteredAST, visitedSchemaNodeNames);
    const filteredSchemaString = (0, graphql_1.print)(filteredAST);
    const filteredSchema = (0, schema_regex_filter_1.getRegexFilteredSchema)(schemaNodeNamesToExclude, filteredSchemaString);
    const reducedSchemaPath = caller_configuration_parser_1.configuration['schema-reduced'];
    (0, fs_1.writeFileSync)(reducedSchemaPath, filteredSchema);
};
exports.filter = filter;
