import assert from 'assert'
import { readFileSync, writeFileSync } from 'fs'
import { buildSchema, DocumentNode, Kind, Location, parse, print as printSchema, Token } from 'graphql'
import { filterOnlyVisitedSchema } from '../utilities/ast-filter'
import { configuration } from '../utilities/caller-configuration-parser'
import { generateEdges } from '../utilities/edge-generator'
import { generateNodes, SchemaNode } from '../utilities/node-generator'
import { filterOperationsToUse } from '../utilities/operation-filter'

const customMapScalar = 'InputDynamicMap'

// Located here due to stack overflow error due to large schema
const visitedIds = new Set<number>()
const visitedLimitIds = new Set<number>()
let edges: Map<number, Set<number>> = new Map<number, Set<number>>()
let schemaNodeById: Map<number, SchemaNode> = new Map<number, SchemaNode>()
let schemaNodeIdByName: Map<String, number> = new Map<String, number>()
let schemaNodeIdsToExclude: Set<number> = new Set<number>()

const dfs = ({ schemaNodeId, depth, verbose = false }: { schemaNodeId: number; depth: number; verbose?: boolean }) => {
  visitedIds.add(schemaNodeId)

  const visitedNodeName = schemaNodeById.get(schemaNodeId).name

  schemaNodeIdsToExclude.delete(schemaNodeId)

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

const dfsLimit = ({ schemaNodeId, depth, verbose = false }: { schemaNodeId: number; depth: number; verbose?: boolean; }) => {
  visitedLimitIds.add(schemaNodeId)
  const visitedNodeName = schemaNodeById.get(schemaNodeId).name

  if (verbose) console.log(' '.repeat(depth) + visitedNodeName)

  if (checkIfInputToExclude(visitedNodeName)) {
    schemaNodeIdsToExclude.add(schemaNodeId)
    visitedLimitIds.delete(schemaNodeId)
    return
  }

  const children = edges.get(schemaNodeId)

  assert(children !== undefined, `${visitedNodeName} has no children`)

  if (children.size > 0) {
    schemaNodeIdsToExclude.delete(schemaNodeId)

    children.forEach((child) => {
      schemaNodeIdsToExclude.delete(child)

      if (!visitedLimitIds.has(child)) {
        dfsLimit({
          //
          schemaNodeId: child,
          depth: depth + 1,
          ...{
            schemaNodeById,
            verbose,
          },
        });
      }
    })
  }
}

const findAllReachableSchemaNodeIds = ({ startingSchemaNodeNames }: { startingSchemaNodeNames: String[] }) => {
  startingSchemaNodeNames.forEach((startingSchemaNodeName) => {

    if (startingSchemaNodeName === 'Mutation') {
      dfsLimit({
        //
        schemaNodeId: schemaNodeIdByName.get(startingSchemaNodeName),
        depth: 0,
        ...{
          schemaNodeById,
        },
      })
    } else {
      dfs({
        //
        schemaNodeId: schemaNodeIdByName.get(startingSchemaNodeName),
        depth: 0,
        ...{
          schemaNodeById,
        },
      })
    }
  })

  const visitedAllIds = Array.from(new Set([...visitedIds, ...visitedLimitIds, ...schemaNodeIdsToExclude]))

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

  const startingSchemaNodeNames = ['Mutation', 'Query', 'Subscription']
  const visitedSchemaNodeNames = findAllReachableSchemaNodeIds({
    startingSchemaNodeNames,
  })


  /**
   * Output
   */
  console.log('schemaNodesToExclude =', schemaNodeIdsToExclude.size)

  const schemaNodeNamesToExclude = Array.from(schemaNodeIdsToExclude).map((id) => schemaNodeById.get(id).name)

  const filteredAST = filterOnlyVisitedSchema(operationFilteredAST, visitedSchemaNodeNames)

  const filteredSchemaString = printSchema(filteredAST)

  const filteredSchema = addCustomScalar(
    replaceExcludedInputsFromSchema(
      schemaNodeNamesToExclude, filterRegex(
        schemaNodeNamesToExclude, filteredSchemaString
      )
    )
  )

  const reducedSchemaPath = configuration['schema-reduced']

  writeFileSync(reducedSchemaPath, filteredSchema)
}

const filterRegex = (typesToEmpty: string[], filteredSchema: string) => {
  const modifiedText = filteredSchema.split('\n\n').map(typeDef => {
    const typeName = typeDef.match(/input\s+(\w+)\s*\{/)?.[1];
    return typeName && typesToEmpty.includes(typeName) ? `` : typeDef;
  }).join('\n\n');

  return modifiedText;
}

const checkIfInputToExclude = (schemaNodeName: string): boolean => {
  return /\b\w+(CreateWithout)\w+(Input)\b/.test(schemaNodeName)
    || /\b\w+(UpdateWithout)\w+(Input)\b/.test(schemaNodeName);
}

const replaceExcludedInputsFromSchema = (schemaNodeNamesToExclude: string[], filteredSchema: string): string => {
  let arrangedSchema = filteredSchema

  schemaNodeNamesToExclude.forEach((schemaNodeName) => {
    arrangedSchema = arrangedSchema.replaceAll(`: ${schemaNodeName}`, `: ${customMapScalar}`)
    arrangedSchema = arrangedSchema.replaceAll(`: [${schemaNodeName}`, `: [${customMapScalar}`)
  })

  return arrangedSchema
}

const addCustomScalar = (schema: string): string => {
  return schema + `\n\nscalar ${customMapScalar}\n`;
}
