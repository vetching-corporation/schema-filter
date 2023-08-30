"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterOnlyVisitedSchema = void 0;
const graphql_1 = require("graphql");
const filterOnlyVisitedSchema = (ast, visitedSchemaNodeNames) => {
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
    });
};
exports.filterOnlyVisitedSchema = filterOnlyVisitedSchema;
