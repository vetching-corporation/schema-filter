#! /usr/bin/env node

import { program } from 'commander'
// import { list } from './commands/list'

program.option('--first').option('-s, --separator <char>')

program.parse()

const options = program.opts()
const limit = options.first ? 1 : undefined
console.log(program.args[0].split(options.separator, limit))

// program //
//   .command('list')
//   .description('List all the TODO tasks')
//   .action(list)

// program.parse()
