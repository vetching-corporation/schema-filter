#!/usr/bin/env node

import { program } from 'commander'
import { excludeOperation } from './commands/exclude-operation'
import { filter } from './commands/filter'
import { includeOperation } from './commands/include-operation'
import { initializeCheckList } from './commands/initialize-check-list'
import { getConfiguration } from './utilities/caller-configuration-parser'

getConfiguration()

program //
  .command('init')
  .description('generate or update check-list')
  .action(initializeCheckList)

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
  .description('filter operation from schema using check-list')
  .action(filter)

program.parse()
