import assert from 'assert'
import chalk from 'chalk'
import finder from 'find-package-json'
import path from 'path/posix'
import { Configuration } from '../types/configuration'

export let configuration: Configuration

/// warns if not set
export const parseCallerPackageJson = (packageInfo: any): Configuration => {
  const info = packageInfo['schema-filter']

  const schemaOriginal = info['schema-original']
  let filters = info['filters']
  let schemaReduced = info['schema-reduced']
  let batchSetting = info['batch-setting']
  let schemaNodeNameRegexesToExclude = info['node-name-regex-to-exclude']

  assert(
    schemaOriginal !== undefined,
    'Failed to retrieve schema file path. It\'s required field. did you forget to provide "schema-original" field in package.json?',
  )

  if (filters === undefined) {
    filters = path.join(path.dirname(schemaOriginal), 'filters')

    console.log(
      chalk.yellow(
        [
          `"filters" field is missing. It's okay but we will generate operation filter json files under ${filters}`,
          `you can override this behavior by providing value for "filters" under "schema-filter" field of "package.json"`,
          '',
        ].join('\n'),
      ),
    )

    assert(
      filters !== undefined,
      'Failed to retrieve schema file path. It\'s required field. did you forget to provide "schema-original" field in package.json?',
    )
  }

  if (schemaReduced === undefined) {
    schemaReduced = path.join(path.dirname(schemaOriginal), 'schema-reduced.graphql')

    console.log(
      chalk.yellow(
        [
          `"schema-reduced" field is missing. It's okay but we will generate reduced schema file at ${schemaReduced}`,
          `you can override this behavior by providing value for "schema-reduced" under "schema-filter" field of "package.json"`,
          '',
        ].join('\n'),
      ),
    )

    assert(
      schemaReduced !== undefined,
      'Failed to retrieve schema file path. It\'s required field. did you forget to provide "schema-original" field in package.json?',
    )
  }

  return {
    'schema-original': schemaOriginal,
    filters: filters,
    'schema-reduced': schemaReduced,
    'batch-setting':
      batchSetting === undefined
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
    'node-name-regexes-to-exclude': schemaNodeNameRegexesToExclude === undefined ? [] : schemaNodeNameRegexesToExclude,
  }
}

export const getConfiguration = () => {
  const callerPackageJsonInformation = finder().next().value

  assert(
    callerPackageJsonInformation !== undefined,
    'Failed to get package information. Are you in project directory root-path?',
  )

  configuration = parseCallerPackageJson(callerPackageJsonInformation)

  console.log(configuration)
}
