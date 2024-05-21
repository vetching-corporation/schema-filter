"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCustomScalarType = exports.filterOnlyVisitedSchema = void 0;
const graphql_1 = require("graphql");
const filterOnlyVisitedSchema = (ast, visitedSchemaNodeNames, schemaNodeNamesToExclude, customScalarName) => {
    return (0, graphql_1.visit)(ast, {
        enter(node) {
            if (!(node.kind === graphql_1.Kind.DIRECTIVE_DEFINITION ||
                node.kind === graphql_1.Kind.SCALAR_TYPE_DEFINITION ||
                node.kind === graphql_1.Kind.ENUM_TYPE_DEFINITION ||
                node.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                node.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION)) {
                return node;
            }
            const { name: { value: name }, } = node;
            if (!visitedSchemaNodeNames.has(name))
                return null;
            return node;
        },
        NamedType(node) {
            if (!schemaNodeNamesToExclude ||
                !customScalarName ||
                schemaNodeNamesToExclude.size === 0 ||
                customScalarName.length === 0) {
                return node;
            }
            if (schemaNodeNamesToExclude.has(node.name.value)) {
                return {
                    ...node,
                    name: {
                        ...node.name,
                        value: customScalarName,
                    },
                };
            }
            return node;
        }
    });
};
exports.filterOnlyVisitedSchema = filterOnlyVisitedSchema;
const addCustomScalarType = (ast, customScalarName) => {
    if (!customScalarName) {
        return ast;
    }
    const scalarTypeDefinitionNode = {
        kind: graphql_1.Kind.SCALAR_TYPE_DEFINITION,
        name: {
            kind: graphql_1.Kind.NAME,
            value: customScalarName,
        },
    };
    const newAstDefinitions = [...ast.definitions, scalarTypeDefinitionNode];
    return {
        ...ast,
        definitions: newAstDefinitions,
    };
};
exports.addCustomScalarType = addCustomScalarType;
