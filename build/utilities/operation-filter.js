"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterOperationsToUse = void 0;
const graphql_1 = require("graphql");
const operation_loader_1 = require("./operation-loader");
const filterOperationsToUse = (ast) => {
    const operationNamesToUse = {
        queryNames: new Set((0, operation_loader_1.loadQueries)()
            .filter((query) => query.inUse)
            .map((query) => query.name)),
        mutationNames: new Set((0, operation_loader_1.loadMutations)()
            .filter((query) => query.inUse)
            .map((query) => query.name)),
        subscriptionNames: new Set((0, operation_loader_1.loadSubscriptions)()
            .filter((query) => query.inUse)
            .map((query) => query.name)),
    };
    return (0, graphql_1.visit)(ast, {
        enter(node) {
            if (node.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION) {
                const name = node.name.value;
                if (node.fields === undefined) {
                    return node;
                }
                switch (name) {
                    case 'Query':
                        return {
                            ...node,
                            fields: node.fields.filter((field) => operationNamesToUse.queryNames.has(field.name.value)) ?? [],
                        };
                    case 'Mutation':
                        return {
                            ...node,
                            fields: node.fields.filter((field) => operationNamesToUse.mutationNames.has(field.name.value)) ?? [],
                        };
                    case 'Subscription':
                        return {
                            ...node,
                            fields: node.fields.filter((field) => operationNamesToUse.subscriptionNames.has(field.name.value)) ?? [],
                        };
                }
            }
            return node;
        },
    });
};
exports.filterOperationsToUse = filterOperationsToUse;
