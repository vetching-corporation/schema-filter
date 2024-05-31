"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOperations = exports.loadSubscriptions = exports.loadMutations = exports.loadQueries = void 0;
const fs_1 = require("fs");
const posix_1 = require("path/posix");
const caller_configuration_parser_1 = require("./caller-configuration-parser");
const loadQueries = () => {
    const path = (0, posix_1.join)(caller_configuration_parser_1.configuration.filters, 'Query.json');
    console.log(`loading Query filter from ${path}`);
    return (0, fs_1.existsSync)(path) ? JSON.parse((0, fs_1.readFileSync)(path, 'utf-8')) : [];
};
exports.loadQueries = loadQueries;
const loadMutations = () => {
    const path = (0, posix_1.join)(caller_configuration_parser_1.configuration.filters, 'Mutation.json');
    console.log(`loading Mutation filter from ${path}`);
    return (0, fs_1.existsSync)(path) ? JSON.parse((0, fs_1.readFileSync)(path, 'utf-8')) : [];
};
exports.loadMutations = loadMutations;
const loadSubscriptions = () => {
    const path = (0, posix_1.join)(caller_configuration_parser_1.configuration.filters, 'Subscription.json');
    console.log(`loading Subscription filter from ${path}`);
    return (0, fs_1.existsSync)(path) ? JSON.parse((0, fs_1.readFileSync)(path, 'utf-8')) : [];
};
exports.loadSubscriptions = loadSubscriptions;
const loadOperations = () => {
    return [...(0, exports.loadQueries)(), ...(0, exports.loadMutations)(), ...(0, exports.loadSubscriptions)()];
};
exports.loadOperations = loadOperations;
