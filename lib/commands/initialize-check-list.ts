import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import {
  DefinitionNode,
  DocumentNode,
  ExecutableDefinitionNode,
  Kind,
  TypeSystemDefinitionNode,
  TypeSystemExtensionNode,
  parse,
} from 'graphql'
import * as path from 'path/posix'

import { assert } from 'console'
import { lowerCase } from 'lodash'
import { Operation } from '../types/operation'
import { cofiguration } from '../utilities/caller-configuration-parser'

const isTypeSystemExtensionNode = (node: DefinitionNode): node is TypeSystemExtensionNode => {
  return (
    node.kind === Kind.SCHEMA_EXTENSION ||
    node.kind === Kind.SCALAR_TYPE_EXTENSION ||
    node.kind === Kind.OBJECT_TYPE_EXTENSION ||
    node.kind === Kind.INTERFACE_TYPE_EXTENSION ||
    node.kind === Kind.UNION_TYPE_EXTENSION ||
    node.kind === Kind.ENUM_TYPE_EXTENSION ||
    node.kind === Kind.INPUT_OBJECT_TYPE_EXTENSION
  )
}

const isExecutableDefinitionNode = (node: DefinitionNode): node is ExecutableDefinitionNode => {
  return node.kind === Kind.OPERATION_DEFINITION || node.kind === Kind.FRAGMENT_DEFINITION
}

const isTypeSystemDefinitionNode = (node: DefinitionNode): node is TypeSystemDefinitionNode => {
  return (
    node.kind === Kind.SCHEMA_DEFINITION ||
    node.kind === Kind.SCALAR_TYPE_DEFINITION ||
    node.kind === Kind.OBJECT_TYPE_DEFINITION ||
    node.kind === Kind.INTERFACE_TYPE_DEFINITION ||
    node.kind === Kind.UNION_TYPE_DEFINITION ||
    node.kind === Kind.ENUM_TYPE_DEFINITION ||
    node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ||
    node.kind === Kind.DIRECTIVE_DEFINITION
  )
}

const loadCurrentUsage = ({ filterPath }: { filterPath: string }) => {
  const currentInUseOperationMap: Map<String, boolean> = new Map<String, boolean>()

  const queryPath = path.join(filterPath, 'Query.json')
  const mutationPath = path.join(filterPath, 'Mutation.json')
  const subscriptionPath = path.join(filterPath, 'Subscription.json')

  const queries: Operation[] = existsSync(queryPath) ? JSON.parse(readFileSync(queryPath, 'utf-8')) : []
  const mutations: Operation[] = existsSync(mutationPath) ? JSON.parse(readFileSync(mutationPath, 'utf-8')) : []
  const subscriptions: Operation[] = existsSync(subscriptionPath)
    ? JSON.parse(readFileSync(subscriptionPath, 'utf-8'))
    : []

  const operations = [...queries, ...mutations, ...subscriptions]

  operations.forEach((operation) => currentInUseOperationMap.set(operation.name, operation.inUse))

  return currentInUseOperationMap
}

export const initializeCheckList = () => {
  const originalSchema = readFileSync(cofiguration['schema-original'], 'utf-8')
  const ast = parse(originalSchema)
  const outputPath = cofiguration['filters']

  if (!existsSync(outputPath)) {
    mkdirSync(outputPath)
  }

  /// Where we start traversing
  /// and how to get actual graphql operations
  const fieldLevelLookUpTypeNames: Set<String> = new Set<String>(['Query', 'Mutation', 'Subscription'])

  const isOperationInUse = loadCurrentUsage({
    filterPath: outputPath,
  })

  /// used to log
  const kindCounts: Map<Kind, number> = new Map<Kind, number>()

  /**
   * Query, Mutation, Subscription 목록을 가져오자.
   */
  const lookForExecutableDefinitionNodes = (ast: DocumentNode) => {
    const definitionNodes = ast.definitions
    for (let index = 0; index < definitionNodes.length; index++) {
      const definitionNode = definitionNodes.at(index)

      assert(!!definitionNode, 'definitionNode not found')

      kindCounts.set(definitionNode.kind, (kindCounts.get(definitionNode.kind) ?? 0) + 1)

      if (isTypeSystemExtensionNode(definitionNode)) {
        continue
      }

      if (isExecutableDefinitionNode(definitionNode)) {
        continue
      }

      if (isTypeSystemDefinitionNode(definitionNode)) {
        // we're only looking for query, mutation, subscription!

        switch (definitionNode.kind) {
          case Kind.SCHEMA_DEFINITION:
          case Kind.SCALAR_TYPE_DEFINITION:
          case Kind.INTERFACE_TYPE_DEFINITION:
          case Kind.UNION_TYPE_DEFINITION:
          case Kind.ENUM_TYPE_DEFINITION:
          case Kind.INPUT_OBJECT_TYPE_DEFINITION:
          case Kind.DIRECTIVE_DEFINITION:
            continue
          case Kind.OBJECT_TYPE_DEFINITION:
            const typeName = definitionNode.name.value

            if (fieldLevelLookUpTypeNames.has(typeName)) {
              const operationInUse: Operation[] = []

              definitionNode.fields?.forEach((field) => {
                const fieldName = field.name.value

                const batchSettingToUse = cofiguration['batch-setting'][lowerCase(typeName)]

                operationInUse.push({
                  inUse: isOperationInUse.has(fieldName) ? isOperationInUse.get(fieldName)! : batchSettingToUse,
                  name: fieldName,
                })
              })

              writeFileSync(path.join(outputPath, `${typeName}.json`), JSON.stringify(operationInUse, undefined, 2))
            }
        }
      }
    }
  }

  lookForExecutableDefinitionNodes(ast)
}
