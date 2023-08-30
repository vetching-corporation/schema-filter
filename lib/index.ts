#!/usr/bin/env node

import { program } from 'commander'
import { excludeOperation } from './commands/exclude'
import { filter } from './commands/filter'
import { includeOperation } from './commands/include'
import { initializeFilters } from './commands/init'
import { getConfiguration } from './utilities/caller-configuration-parser'

getConfiguration()

program //
  .command('init')
  .description('generate or update filters')
  .action(initializeFilters)

program //
  .command('include <operationName>')
  .description('include operation to schema')
  .action(includeOperation)

program //
  .command('exclude <operationName>')
  .description('exclude operation from schema')
  .action(excludeOperation)

program //
  .command('filter')
  .description('filter operation from schema using filters')
  .action(filter)

program.parse()
