"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterOnlyVisitedSchema = void 0;
const graphql_1 = require("graphql");
const filterOnlyVisitedSchema = ({ ast, visitedSchemaNodeNames, schemaNodeNamesToExclude, customScalarName, }) => {
    console.log('[PPPP] visitedSchemaNodeNames', visitedSchemaNodeNames);
    const unionNodes = ast.definitions.filter(def => def.kind === graphql_1.Kind.UNION_TYPE_DEFINITION);
    console.log('[PPPP] unionNodes found in AST:', unionNodes);
    for (const unionNode of unionNodes) {
        if (unionNode.kind === graphql_1.Kind.UNION_TYPE_DEFINITION && unionNode.types) {
            console.log('[PPPP] Processing unionNode:', unionNode);
            for (const typeNode of unionNode.types) {
                visitedSchemaNodeNames.add(typeNode.name.value);
                console.log('[PPPP] Added to visitedSchemaNodeNames from union:', typeNode.name.value);
            }
        }
    }
    return (0, graphql_1.visit)(ast, {
        /**
         * 방문한 기록이 있는 node만 남깁니다.
         * */
        enter(node) {
            // console.log('visitedSchemaNodeNames', visitedSchemaNodeNames)
            // if (node.kind === Kind.OBJECT_TYPE_DEFINITION && node.name.value.includes('Union')) {
            //   console.log('[PPPP] Union type found:', node);
            // }
            // if (node.kind === Kind.UNION_TYPE_DEFINITION && node.types) {
            //   console.log('[PPPP] Union type found:', node);
            // }
            // if (node.kind === Kind.UNION_TYPE_DEFINITION && node.types) {
            //   // node.types는 [{ kind: 'NamedType', name: { value: 'SomeType' } }, ...]
            //   for (const typeNode of node.types) {
            //     visitedSchemaNodeNames.add(typeNode.name.value)
            //   }
            //
            //   console.log('[PPPP] Union type processed, added types to visitedSchemaNodeNames:', node.types.map(t => t.name.value));
            //   // union 타입은 무조건 남긴다
            //   return node;
            // }
            if (!(node.kind === graphql_1.Kind.DIRECTIVE_DEFINITION ||
                node.kind === graphql_1.Kind.SCALAR_TYPE_DEFINITION ||
                node.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                node.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION)) {
                return node;
            }
            /**
             * interface를 implement하는 type이라면, API에서 방문하지 않을 수 있습니다.
             * 따라서 강제로 추가해 줍니다.
             */
            if (node.kind == graphql_1.Kind.OBJECT_TYPE_DEFINITION && node.interfaces.length > 0) {
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
