"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCustomScalarType = void 0;
const index_1 = require("graphql/index");
/**
 * 스키마에 custom scalar type을 추가합니다.
 * */
const addCustomScalarType = ({ ast, customScalarName, }) => {
    if (!customScalarName) {
        return ast;
    }
    const scalarTypeDefinitionNode = {
        kind: index_1.Kind.SCALAR_TYPE_DEFINITION,
        name: {
            kind: index_1.Kind.NAME,
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
