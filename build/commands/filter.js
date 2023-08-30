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
// Located here due to stack overflow error due to large schema
const visitedIds = new Set();
let edges = new Map();
let schemaNodeById = new Map();
let schemaNodeIdByName = new Map();
const dfs = ({ schemaNodeId, depth, verbose = false }) => {
    visitedIds.add(schemaNodeId);
    const visitedNodeName = schemaNodeById.get(schemaNodeId).name;
    if (verbose)
        console.log(' '.repeat(depth) + visitedNodeName);
    const children = edges.get(schemaNodeId);
    (0, assert_1.default)(children !== undefined, `${visitedNodeName} has no children`);
    if (children.size > 0) {
        children.forEach((child) => {
            if (!visitedIds.has(child)) {
                dfs({
                    //
                    schemaNodeId: child,
                    depth: depth + 1,
                    ...{
                        schemaNodeById,
                        verbose,
                    },
                });
            }
        });
    }
};
const findAllReachableSchemaNodeIds = ({ startingSchemaNodeNames }) => {
    startingSchemaNodeNames.forEach((startingSchemaNodeName) => dfs({
        //
        schemaNodeId: schemaNodeIdByName.get(startingSchemaNodeName),
        depth: 0,
        ...{
            schemaNodeById,
        },
    }));
    return new Set(Array.from(visitedIds).map((visitedId) => schemaNodeById.get(visitedId).name));
};
const filter = () => {
    /* -------------------------------------------------------------------------- */
    /*                                 Entry Point                                */
    /* -------------------------------------------------------------------------- */
    const originalSchemaPath = caller_configuration_parser_1.cofiguration['schema-original'];
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
    const filteredAST = (0, ast_filter_1.filterOnlyVisitedSchema)(operationFilteredAST, visitedSchemaNodeNames);
    const filteredSchema = (0, graphql_1.print)(filteredAST);
    const reducedSchemaPath = caller_configuration_parser_1.cofiguration['schema-reduced'];
    (0, fs_1.writeFileSync)(reducedSchemaPath, filteredSchema);
};
exports.filter = filter;
