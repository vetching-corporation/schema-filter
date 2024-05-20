import assert from 'assert'
import { readFileSync, writeFileSync } from 'fs'
import { parse, print as printSchema } from 'graphql'
import { filterOnlyVisitedSchema } from '../utilities/ast-filter'
import { configuration } from '../utilities/caller-configuration-parser'
import { generateEdges } from '../utilities/edge-generator'
import { generateNodes, SchemaNode } from '../utilities/node-generator'
import { filterOperationsToUse } from '../utilities/operation-filter'
import { checkIfInputToExclude, getRegexFilteredSchema } from '../utilities/schema-regex-filter'
import chalk from 'chalk'

// Located here due to stack overflow error due to large schema
const visitedIds = new Set<number>()
let edges: Map<number, Set<number>> = new Map<number, Set<number>>()
let schemaNodeById: Map<number, SchemaNode> = new Map<number, SchemaNode>()
let schemaNodeIdByName: Map<String, number> = new Map<String, number>()
let schemaNodeIdsToExclude: Set<number> = new Set<number>()

const dfs = ({ schemaNodeId, depth, verbose = false }: { schemaNodeId: number; depth: number; verbose?: boolean }) => {
  visitedIds.add(schemaNodeId)
  const visitedNodeName = schemaNodeById.get(schemaNodeId).name

  if (verbose) console.log(' '.repeat(depth) + visitedNodeName)

  if (checkIfInputToExclude(visitedNodeName)) {
    schemaNodeIdsToExclude.add(schemaNodeId)
    visitedIds.delete(schemaNodeId)
    return
  }

  const children = edges.get(schemaNodeId)

  assert(children !== undefined, `${visitedNodeName} has no children`)

  if (children.size > 0) {
    schemaNodeIdsToExclude.delete(schemaNodeId)

    children.forEach((child) => {
      schemaNodeIdsToExclude.delete(child)

      if (!visitedIds.has(child)) {
        dfs({
          //
          schemaNodeId: child,
          depth: depth + 1,
          verbose,
        });
      }
    })
  }
}

const findAllReachableSchemaNodeIds = ({ startingSchemaNodeNames }: { startingSchemaNodeNames: String[] }) => {
  if (startingSchemaNodeNames.includes('Mutation') && configuration['node-name-regexes-to-exclude'].length === 0) {
    console.log(
      chalk.yellow(
        '[WARNING] Filter option includes Mutation, however, \'node-name-regexes-to-exclude\' is not provided or empty in package.json.\n',
        'This may lead to unexpected stack overflow.'
      )
    )
  }

  startingSchemaNodeNames.forEach((startingSchemaNodeName) => {
    dfs({
      //
      schemaNodeId: schemaNodeIdByName.get(startingSchemaNodeName),
      depth: 0,
    })
  })

  const visitedAllIds = Array.from(new Set([...visitedIds, ...schemaNodeIdsToExclude]))

  return new Set<String>(visitedAllIds.map((visitedId) => schemaNodeById.get(visitedId).name))
}

export const filter = () => {
  /* -------------------------------------------------------------------------- */
  /*                                 Entry Point                                */
  /* -------------------------------------------------------------------------- */

  const originalSchemaPath = configuration['schema-original']
  const originalSchema = readFileSync(originalSchemaPath, 'utf-8')
  const originalAST = parse(originalSchema)

  /* -------------------------------------------------------------------------- */
  /*                             Operation Filtering                            */
  /* -------------------------------------------------------------------------- */

  /**
   * - type Query
   * - type Mutation
   * - type Subscription
   *
   * 위 3개의 블록에서 원하는 줄만 남기고 삭제한다.
   */

  const operationFilteredAST = filterOperationsToUse(originalAST)

  const nodes = generateNodes(operationFilteredAST)

  schemaNodeById = nodes.schemaNodeById
  schemaNodeIdByName = nodes.schemaNodeIdByName

  edges = generateEdges({
    ast: operationFilteredAST,
    schemaNodeIdByName,
  })

  /* -------------------------------------------------------------------------- */
  /*                          Traversing (Visit Check)                          */
  /* -------------------------------------------------------------------------- */

  /**
   * Starting from [Query, Mutation, Subscription], Traverse
   */

  const startingSchemaNodeNames = ['Query', 'Mutation', 'Subscription']
  const visitedSchemaNodeNames = findAllReachableSchemaNodeIds({
    startingSchemaNodeNames,
  })


  /**
   * Output
   */
  console.log('schemaNodesToExclude count =', schemaNodeIdsToExclude.size)

  const schemaNodeNamesToExclude = Array.from(schemaNodeIdsToExclude).map((id) => schemaNodeById.get(id).name)

  const filteredAST = filterOnlyVisitedSchema(operationFilteredAST, visitedSchemaNodeNames)

  const filteredSchemaString = printSchema(filteredAST)

  const filteredSchema = getRegexFilteredSchema(schemaNodeNamesToExclude, filteredSchemaString)

  const reducedSchemaPath = configuration['schema-reduced']

  writeFileSync(reducedSchemaPath, filteredSchema)
}
