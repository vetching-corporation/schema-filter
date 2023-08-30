import { DocumentNode, Kind, visit } from 'graphql'
import { loadMutations, loadQueries, loadSubscriptions } from './operation-loader'

export const filterOperationsToUse = (ast: DocumentNode): DocumentNode => {
  const operationNamesToUse = {
    queryNames: new Set<String>(
      loadQueries()
        .filter((query) => query.inUse)
        .map((query) => query.name),
    ),
    mutationNames: new Set<String>(
      loadMutations()
        .filter((query) => query.inUse)
        .map((query) => query.name),
    ),
    subscriptionNames: new Set<String>(
      loadSubscriptions()
        .filter((query) => query.inUse)
        .map((query) => query.name),
    ),
  }

  return visit(ast, {
    enter(node) {
      if (node.kind === Kind.OBJECT_TYPE_DEFINITION) {
        const name = node.name.value

        if (node.fields === undefined) {
          return node
        }

        switch (name) {
          case 'Query':
            return {
              ...node,
              fields: node.fields.filter((field) => operationNamesToUse.queryNames.has(field.name.value)) ?? [],
            }
          case 'Mutation':
            return {
              ...node,
              fields: node.fields.filter((field) => operationNamesToUse.mutationNames.has(field.name.value)) ?? [],
            }
          case 'Subscription':
            return {
              ...node,
              fields: node.fields.filter((field) => operationNamesToUse.subscriptionNames.has(field.name.value)) ?? [],
            }
        }
      }

      return node
    },
  })
}
