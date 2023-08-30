"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = exports.parseCallerPackageJson = exports.cofiguration = void 0;
const assert_1 = __importDefault(require("assert"));
const chalk_1 = __importDefault(require("chalk"));
const find_package_json_1 = __importDefault(require("find-package-json"));
const posix_1 = __importDefault(require("path/posix"));
/// warns if not set
const parseCallerPackageJson = (packageInfo) => {
    const info = packageInfo['schema-filter'];
    const schemaOriginal = info['schema-original'];
    let filters = info['filters'];
    let schemaReduced = info['schema-reduced'];
    let batchSetting = info['batch-setting'];
    (0, assert_1.default)(schemaOriginal !== undefined, 'Failed to retrieve schema file path. It\'s required field. did you forget to provide "schema-original" field in package.json?');
    if (filters === undefined) {
        filters = posix_1.default.join(posix_1.default.dirname(schemaOriginal), 'filters');
        console.log(chalk_1.default.yellow([
            `"filters" field is missing. It's okay but we will generate operation filter json files under ${filters}`,
            `you can override this behavior by providing value for "filters" under "schema-filter" field of "package.json"`,
            '',
        ].join('\n')));
        (0, assert_1.default)(filters !== undefined, 'Failed to retrieve schema file path. It\'s required field. did you forget to provide "schema-original" field in package.json?');
    }
    if (schemaReduced === undefined) {
        schemaReduced = posix_1.default.join(posix_1.default.dirname(schemaOriginal), 'schema-reduced.graphql');
        console.log(chalk_1.default.yellow([
            `"schema-reduced" field is missing. It's okay but we will generate reduced schema file at ${schemaReduced}`,
            `you can override this behavior by providing value for "schema-reduced" under "schema-filter" field of "package.json"`,
            '',
        ].join('\n')));
        (0, assert_1.default)(schemaReduced !== undefined, 'Failed to retrieve schema file path. It\'s required field. did you forget to provide "schema-original" field in package.json?');
    }
    return {
        'schema-original': schemaOriginal,
        filters: filters,
        'schema-reduced': schemaReduced,
        'batch-setting': batchSetting === undefined
            ? {
                query: true,
                mutation: true,
                subscription: true,
            }
            : {
                query: batchSetting['query'] === undefined ? true : batchSetting['query'],
                mutation: batchSetting['mutation'] === undefined ? true : batchSetting['mutation'],
                subscription: batchSetting['subscription'] === undefined ? true : batchSetting['subscription'],
            },
    };
};
exports.parseCallerPackageJson = parseCallerPackageJson;
const getConfiguration = () => {
    const callerPackageJsonInformation = (0, find_package_json_1.default)().next().value;
    (0, assert_1.default)(callerPackageJsonInformation !== undefined, 'Failed to get package information. Are you in project directory root-path?');
    exports.cofiguration = (0, exports.parseCallerPackageJson)(callerPackageJsonInformation);
    console.log(exports.cofiguration);
};
exports.getConfiguration = getConfiguration;
