"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEdges = void 0;
const graphql_1 = require("graphql");
const lodash_1 = require("lodash");
const getName = (type) => {
    switch (type.kind) {
        case graphql_1.Kind.NAMED_TYPE:
            return type.name.value;
        case graphql_1.Kind.LIST_TYPE:
        case graphql_1.Kind.NON_NULL_TYPE:
            return getName(type.type);
    }
};
/* -------------------------------------------------------------------------- */
/*                              Input Schema Node                             */
/* -------------------------------------------------------------------------- */
const getInputSchemaNodeRelatedSchemaNodeIds = (fields, schemaNodeIdByName) => {
    return (0, lodash_1.compact)(getInputRelatedTypeNames(fields, schemaNodeIdByName).map((fieldName) => schemaNodeIdByName.get(fieldName)));
};
const getInputRelatedTypeNames = (fields, schemaNodeIdByName) => {
    const relatedTypeNames = new Set();
    for (let index = 0; index < fields.length; index++) {
        const field = fields[index];
        const { name, type } = field;
        relatedTypeNames.add(getName(type));
    }
    return Array.from(relatedTypeNames);
};
/* -------------------------------------------------------------------------- */
/*                              Type Schema Node                              */
/* -------------------------------------------------------------------------- */
const getTypeSchemaNodeRelatedSchemaNodeIds = ({ parentNodeName, fields, schemaNodeIdByName, }) => {
    return (0, lodash_1.compact)(getFieldDefinitionNodeInputRelatedTypeNames(fields, schemaNodeIdByName).map((fieldName) => schemaNodeIdByName.get(fieldName)));
};
const getFieldDefinitionNodeInputRelatedTypeNames = (fields, schemaNodeIdByName) => {
    const relatedTypeNames = new Set();
    for (let index = 0; index < fields.length; index++) {
        const field = fields[index];
        /* -------------------------------------------------------------------------- */
        /*                                 Return Type                                */
        /* -------------------------------------------------------------------------- */
        const returnType = field.type;
        relatedTypeNames.add(getName(returnType));
        /* -------------------------------------------------------------------------- */
        /*                           Arguments (Parameters)                           */
        /* -------------------------------------------------------------------------- */
        const clonedArguments = Array.from(field.arguments);
        const inputRelatedTypeNames = getInputRelatedTypeNames(clonedArguments, schemaNodeIdByName);
        inputRelatedTypeNames.forEach((inputRelatedTypeName) => {
            relatedTypeNames.add(inputRelatedTypeName);
        });
    }
    return Array.from(relatedTypeNames);
};
const generateEdges = ({ ast, schemaNodeIdByName, }) => {
    const edges = new Map();
    const definitionNodes = ast.definitions;
    for (let index = 0; index < definitionNodes.length; index++) {
        const definitionNode = definitionNodes[index];
        if (!(definitionNode.kind === graphql_1.Kind.DIRECTIVE_DEFINITION ||
            definitionNode.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
            definitionNode.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION ||
            definitionNode.kind === graphql_1.Kind.SCALAR_TYPE_DEFINITION ||
            definitionNode.kind === graphql_1.Kind.ENUM_TYPE_DEFINITION))
            continue;
        const { name: nameNode } = definitionNode;
        const name = nameNode.value;
        const id = schemaNodeIdByName.get(name);
        edges.set(id, new Set());
        switch (definitionNode.kind) {
            case graphql_1.Kind.DIRECTIVE_DEFINITION:
            case graphql_1.Kind.SCALAR_TYPE_DEFINITION:
            case graphql_1.Kind.ENUM_TYPE_DEFINITION:
                continue;
            case graphql_1.Kind.OBJECT_TYPE_DEFINITION: {
                const { fields } = definitionNode;
                if (fields === undefined) {
                    console.log(`${name} has not fields`);
                    continue;
                }
                const relatedNodeIds = getTypeSchemaNodeRelatedSchemaNodeIds({
                    parentNodeName: name,
                    fields: Array.from(fields),
                    schemaNodeIdByName,
                });
                relatedNodeIds.forEach((relatedNodeId) => edges.get(id)?.add(relatedNodeId));
                break;
            }
            case graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION: {
                const { fields } = definitionNode;
                if (fields === undefined) {
                    console.log(`${name} has not fields`);
                    break;
                }
                const relatedNodeIds = getInputSchemaNodeRelatedSchemaNodeIds(Array.from(fields), schemaNodeIdByName);
                relatedNodeIds.forEach((relatedNodeId) => edges.get(id)?.add(relatedNodeId));
                break;
            }
        }
    }
    console.log('generated edges');
    return edges;
};
exports.generateEdges = generateEdges;
