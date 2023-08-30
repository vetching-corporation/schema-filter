import assert from 'assert'
import chalk from 'chalk'

export const includeOperation = (operationName?: string) => {
  assert(operationName !== undefined, 'operation name is required')

  console.log('including', operationName)

  console.log(chalk.yellowBright(`not implemented yet, sorry`))

  process.exit()
}
