#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const exclude_1 = require("./commands/exclude");
const filter_1 = require("./commands/filter");
const include_1 = require("./commands/include");
const init_1 = require("./commands/init");
const caller_configuration_parser_1 = require("./utilities/caller-configuration-parser");
(0, caller_configuration_parser_1.getConfiguration)();
commander_1.program //
    .command('init')
    .description('generate or update filters')
    .action(init_1.initializeFilters);
commander_1.program //
    .command('include <operationName>')
    .description('include operation to schema')
    .action(include_1.includeOperation);
commander_1.program //
    .command('exclude <operationName>')
    .description('exclude operation from schema')
    .action(exclude_1.excludeOperation);
commander_1.program //
    .command('filter')
    .description('filter operation from schema using filters')
    .action(filter_1.filter);
commander_1.program.parse();
