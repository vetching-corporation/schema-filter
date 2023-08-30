import assert from 'assert'
import { readFileSync, writeFileSync } from 'fs'
import { parse, print as printSchema } from 'graphql'
import { filterOnlyVisitedSchema } from '../utilities/ast-filter'
import { cofiguration } from '../utilities/caller-configuration-parser'
import { generateEdges } from '../utilities/edge-generator'
import { SchemaNode, generateNodes } from '../utilities/node-generator'
import { filterOperationsToUse } from '../utilities/operation-filter'

// Located here due to stack overflow error due to large schema
const visitedIds = new Set<number>()
let edges: Map<number, Set<number>> = new Map<number, Set<number>>()
let schemaNodeById: Map<number, SchemaNode> = new Map<number, SchemaNode>()
let schemaNodeIdByName: Map<String, number> = new Map<String, number>()

const dfs = ({ schemaNodeId, depth, verbose = false }: { schemaNodeId: number; depth: number; verbose?: boolean }) => {
  visitedIds.add(schemaNodeId)

  const visitedNodeName = schemaNodeById.get(schemaNodeId).name

  if (verbose) console.log(' '.repeat(depth) + visitedNodeName)

  const children = edges.get(schemaNodeId)

  assert(children !== undefined, `${visitedNodeName} has no children`)

  if (children.size > 0) {
    children.forEach((child) => {
      if (!visitedIds.has(child)) {
        dfs({
          //
          schemaNodeId: child,
          depth: depth + 1,
          ...{
            schemaNodeById,
            verbose,
          },
        })
      }
    })
  }
}

const findAllReachableSchemaNodeIds = ({ startingSchemaNodeNames }: { startingSchemaNodeNames: String[] }) => {
  startingSchemaNodeNames.forEach((startingSchemaNodeName) =>
    dfs({
      //
      schemaNodeId: schemaNodeIdByName.get(startingSchemaNodeName),
      depth: 0,
      ...{
        schemaNodeById,
      },
    }),
  )

  return new Set<String>(Array.from(visitedIds).map((visitedId) => schemaNodeById.get(visitedId).name))
}

export const filter = () => {
  /* -------------------------------------------------------------------------- */
  /*                                 Entry Point                                */
  /* -------------------------------------------------------------------------- */

  const originalSchemaPath = cofiguration['schema-original']
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

  const filteredAST = filterOnlyVisitedSchema(operationFilteredAST, visitedSchemaNodeNames)
  const filteredSchema = printSchema(filteredAST)

  const reducedSchemaPath = cofiguration['schema-reduced']

  writeFileSync(reducedSchemaPath, filteredSchema)
}
