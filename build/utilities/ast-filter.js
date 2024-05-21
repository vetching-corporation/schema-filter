"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCustomScalarType = exports.filterOnlyVisitedSchema = void 0;
const graphql_1 = require("graphql");
const filterOnlyVisitedSchema = ({ ast, visitedSchemaNodeNames, schemaNodeNamesToExclude, customScalarName, }) => {
    return (0, graphql_1.visit)(ast, {
        /**
         * 방문한 기록이 있는 node만 남깁니다.
         * */
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
        /**
         * 제외해야 하는 node를 custom scalar로 바꾸어 줍니다.
         * */
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
/**
 * 스키마에 custom scalar type을 추가합니다.
 * */
const addCustomScalarType = ({ ast, customScalarName }) => {
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
