"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNodes = void 0;
const graphql_1 = require("graphql");
/// Traverse AST and generate nodes
/// filtered AST is usually given and used to generate nodes
const generateNodes = (ast) => {
    /* -------------------------------------------------------------------------- */
    /*                                   Utility                                  */
    /* -------------------------------------------------------------------------- */
    const kindCounts = new Map();
    /* -------------------------------------------------------------------------- */
    /*                                Main Purpose                                */
    /* -------------------------------------------------------------------------- */
    const schemaNodeById = new Map();
    const schemaNodeIdByName = new Map();
    const definitionNodes = ast.definitions;
    for (let index = 0; index < definitionNodes.length; index++) {
        const definitionNode = definitionNodes[index];
        kindCounts.set(definitionNode.kind, (kindCounts.get(definitionNode.kind) ?? 0) + 1);
        if (!(definitionNode.kind === graphql_1.Kind.DIRECTIVE_DEFINITION ||
            definitionNode.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
            definitionNode.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION ||
            definitionNode.kind === graphql_1.Kind.SCALAR_TYPE_DEFINITION ||
            definitionNode.kind === graphql_1.Kind.ENUM_TYPE_DEFINITION)) {
            console.log('another definitionNode type detected');
            continue;
        }
        const id = index + 1;
        const name = definitionNode.name.value;
        const kind = definitionNode.kind;
        schemaNodeById.set(id, {
            id,
            name,
            kind,
        });
        schemaNodeIdByName.set(name, id);
    }
    logCountsBykind(kindCounts);
    console.log('generated nodes');
    return {
        schemaNodeById,
        schemaNodeIdByName,
    };
};
exports.generateNodes = generateNodes;
const logCountsBykind = (kindCounts) => {
    console.log();
    for (let [key, value] of kindCounts) {
        console.log(key + ' = ' + value);
    }
};
