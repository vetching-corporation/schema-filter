import { DocumentNode, Kind } from 'graphql'

export type SchemaNode = {
  id: number
  name: string
  kind: Kind
}

/// Traverse AST and generate nodes
/// filtered AST is usually given and used to generate nodes
export const generateNodes = (
  ast: DocumentNode,
): {
  schemaNodeById: Map<number, SchemaNode>
  schemaNodeIdByName: Map<String, number>
} => {
  /* -------------------------------------------------------------------------- */
  /*                                   Utility                                  */
  /* -------------------------------------------------------------------------- */
  const kindCounts: Map<Kind, number> = new Map<Kind, number>()

  /* -------------------------------------------------------------------------- */
  /*                                Main Purpose                                */
  /* -------------------------------------------------------------------------- */

  const schemaNodeById: Map<number, SchemaNode> = new Map<number, SchemaNode>()
  const schemaNodeIdByName: Map<String, number> = new Map<String, number>()

  const definitionNodes = ast.definitions
  for (let index = 0; index < definitionNodes.length; index++) {
    const definitionNode = definitionNodes[index]

    kindCounts.set(definitionNode.kind, (kindCounts.get(definitionNode.kind) ?? 0) + 1)

    if (
      !(
        definitionNode.kind === Kind.DIRECTIVE_DEFINITION ||
        definitionNode.kind === Kind.OBJECT_TYPE_DEFINITION ||
        definitionNode.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ||
        definitionNode.kind === Kind.SCALAR_TYPE_DEFINITION ||
        definitionNode.kind === Kind.ENUM_TYPE_DEFINITION
      )
    ) {
      console.log('another definitionNode type detected')

      continue
    }

    const id = index + 1
    const name = definitionNode.name.value
    const kind = definitionNode.kind

    schemaNodeById.set(id, {
      id,
      name,
      kind,
    })

    schemaNodeIdByName.set(name, id)
  }

  logCountsBykind(kindCounts)

  console.log('generated nodes')

  return {
    schemaNodeById,
    schemaNodeIdByName,
  }
}

const logCountsBykind = (kindCounts: Map<Kind, number>) => {
  console.log()

  for (let [key, value] of kindCounts) {
    console.log(key + ' = ' + value)
  }
}
