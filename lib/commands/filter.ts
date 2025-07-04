import assert from 'assert'
import { readFileSync, writeFileSync } from 'fs'
import { Kind, parse, print as printSchema } from 'graphql'
import { filterOnlyVisitedSchema } from '../utilities/ast-filter'
import { configuration } from '../utilities/caller-configuration-parser'
import { generateEdges } from '../utilities/edge-generator'
import { generateNodes, SchemaNode } from '../utilities/node-generator'
import { filterOperationsToUse } from '../utilities/operation-filter'
import { doesNodeNameFitRegex } from '../utilities/regex-filter'
import chalk from 'chalk'
import { addCustomScalarType } from '../utilities/ast-util'

// Located here due to stack overflow error due to large schema
const visitedIds = new Set<number>()
let edges: Map<number, Set<number>> = new Map<number, Set<number>>()
let schemaNodeById: Map<number, SchemaNode> = new Map<number, SchemaNode>()
let schemaNodeIdByName: Map<String, number> = new Map<String, number>()
let schemaNodeIdsToExclude: Set<number> = new Set<number>()

const dfs = ({ schemaNodeId, depth, verbose = false }: { schemaNodeId: number; depth: number; verbose?: boolean }) => {
  visitedIds.add(schemaNodeId)

  const currentSchemaNode = schemaNodeById.get(schemaNodeId)
  const visitedNodeName = currentSchemaNode.name
  const visitedNodeKind = currentSchemaNode.kind

  if (verbose) console.log(' '.repeat(depth) + visitedNodeName)

  /**
   * node가 Input Object 타입이고, 사용자가 제외하고자 하는 regex에 걸리는 경우
   * 제외할 목록(Set)에 넣습니다.
   * */
  if (visitedNodeKind === Kind.INPUT_OBJECT_TYPE_DEFINITION && doesNodeNameFitRegex(visitedNodeName)) {
    schemaNodeIdsToExclude.add(schemaNodeId)
    return
  }

  const children = edges.get(schemaNodeId)

  assert(children !== undefined, `${visitedNodeName} has no children`)

  if (children.size > 0) {
    children.forEach((child) => {

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
  if (startingSchemaNodeNames.includes('Mutation') && configuration['input-type-name-regexes-to-remove'].length === 0) {
    console.log(
      chalk.yellow(
        '[WARNING] Filter option includes Mutation, however, \'input-type-name-regexes-to-remove\' is not provided or empty in package.json.\n',
        'This may lead to unexpected stack overflow.'
      )
    )
  }

  startingSchemaNodeNames.forEach((startingSchemaNodeName) => {
    if (!schemaNodeIdByName.has(startingSchemaNodeName)) {
      console.log(
        chalk.yellow(
          '[WARNING] No "' + startingSchemaNodeName + '" found in schema. Skipping traversal for this node.\n',
        )
      )

      return
    }

    dfs({
      //
      schemaNodeId: schemaNodeIdByName.get(startingSchemaNodeName),
      depth: 0,
    })
  })

  const necessaryVisitedIdSet = visitedIds
  schemaNodeIdsToExclude.forEach((idToExclude) => {
    necessaryVisitedIdSet.delete(idToExclude)
  })

  const necessaryVisitedIds = Array.from(necessaryVisitedIdSet)

  return new Set<String>(necessaryVisitedIds.map((visitedId) => schemaNodeById.get(visitedId).name))
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

  const customScalarName = configuration['custom-scalar-name']

  /**
   * Output
   */
  console.log('schemaNodesToExclude count =', schemaNodeIdsToExclude.size)

  const schemaNodeNamesToExclude = new Set(Array.from(schemaNodeIdsToExclude).map((id) => schemaNodeById.get(id).name))

  const visitFilteredAST = filterOnlyVisitedSchema({
    ast: operationFilteredAST,
    visitedSchemaNodeNames,
    schemaNodeNamesToExclude,
    customScalarName,
  })

  const customScalarAddedAST = addCustomScalarType({
    ast: visitFilteredAST,
    customScalarName,
  })

  const filteredSchemaString = printSchema(customScalarAddedAST)

  const reducedSchemaPath = configuration['schema-reduced']

  writeFileSync(reducedSchemaPath, filteredSchemaString)
}
