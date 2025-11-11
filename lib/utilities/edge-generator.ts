import { DocumentNode, FieldDefinitionNode, InputValueDefinitionNode, Kind, TypeNode } from 'graphql'
import { compact } from 'lodash'

const getName = (type: TypeNode): String => {
  switch (type.kind) {
    case Kind.NAMED_TYPE:
      return type.name.value
    case Kind.LIST_TYPE:
    case Kind.NON_NULL_TYPE:
      return getName(type.type)
  }
}

/* -------------------------------------------------------------------------- */
/*                              Input Schema Node                             */
/* -------------------------------------------------------------------------- */
const getInputSchemaNodeRelatedSchemaNodeIds = (
  fields: InputValueDefinitionNode[],
  schemaNodeIdByName: Map<String, number>,
): number[] => {
  return compact(
    getInputRelatedTypeNames(fields, schemaNodeIdByName).map((fieldName) => schemaNodeIdByName.get(fieldName)),
  )
}

const getInputRelatedTypeNames = (
  fields: InputValueDefinitionNode[],
  schemaNodeIdByName: Map<String, number>,
): String[] => {
  const relatedTypeNames: Set<String> = new Set<String>()

  for (let index = 0; index < fields.length; index++) {
    const field = fields[index]

    const { name, type } = field

    relatedTypeNames.add(getName(type))
  }

  return Array.from(relatedTypeNames)
}

/* -------------------------------------------------------------------------- */
/*                              Type Schema Node                              */
/* -------------------------------------------------------------------------- */
const getTypeSchemaNodeRelatedSchemaNodeIds = ({
  parentNodeName,
  fields,
  schemaNodeIdByName,
}: {
  parentNodeName: string
  fields: FieldDefinitionNode[]
  schemaNodeIdByName: Map<String, number>
}): number[] => {
  return compact(
    getFieldDefinitionNodeInputRelatedTypeNames(fields, schemaNodeIdByName).map((fieldName) =>
      schemaNodeIdByName.get(fieldName),
    ),
  )
}

const getFieldDefinitionNodeInputRelatedTypeNames = (
  fields: FieldDefinitionNode[],
  schemaNodeIdByName: Map<String, number>,
): String[] => {
  const relatedTypeNames: Set<String> = new Set<String>()

  for (let index = 0; index < fields.length; index++) {
    const field = fields[index]

    /* -------------------------------------------------------------------------- */
    /*                                 Return Type                                */
    /* -------------------------------------------------------------------------- */
    const returnType = field.type
    relatedTypeNames.add(getName(returnType))

    /* -------------------------------------------------------------------------- */
    /*                           Arguments (Parameters)                           */
    /* -------------------------------------------------------------------------- */
    const clonedArguments = Array.from(field.arguments)

    const inputRelatedTypeNames = getInputRelatedTypeNames(clonedArguments, schemaNodeIdByName)

    inputRelatedTypeNames.forEach((inputRelatedTypeName) => {
      relatedTypeNames.add(inputRelatedTypeName)
    })
  }

  return Array.from(relatedTypeNames)
}

export const generateEdges = ({
  ast,
  schemaNodeIdByName,
}: {
  ast: DocumentNode
  schemaNodeIdByName: Map<String, number>
}) => {
  const edges: Map<number, Set<number>> = new Map<number, Set<number>>()
  const definitionNodes = ast.definitions
  for (let index = 0; index < definitionNodes.length; index++) {
    const definitionNode = definitionNodes[index]

    if (
      !(
        definitionNode.kind === Kind.DIRECTIVE_DEFINITION ||
        definitionNode.kind === Kind.OBJECT_TYPE_DEFINITION ||
        definitionNode.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ||
        definitionNode.kind === Kind.SCALAR_TYPE_DEFINITION ||
        definitionNode.kind === Kind.ENUM_TYPE_DEFINITION ||
        definitionNode.kind === Kind.INTERFACE_TYPE_DEFINITION ||
        definitionNode.kind === Kind.UNION_TYPE_DEFINITION
      )
    )
      continue

    const { name: nameNode } = definitionNode
    const name = nameNode.value
    const id = schemaNodeIdByName.get(name)

    edges.set(id, new Set<number>())

    switch (definitionNode.kind) {
      case Kind.DIRECTIVE_DEFINITION:
      case Kind.SCALAR_TYPE_DEFINITION:
      case Kind.ENUM_TYPE_DEFINITION:
        continue
      case Kind.INTERFACE_TYPE_DEFINITION: {
        const { fields } = definitionNode

        if (fields === undefined) {
          console.log(`${name} has not fields`)
          continue
        }

        // Interface의 필드에서 사용하는 타입들에 대한 edge 생성
        const relatedNodeIds = getTypeSchemaNodeRelatedSchemaNodeIds({
          parentNodeName: name,
          fields: Array.from(fields),
          schemaNodeIdByName,
        })

        relatedNodeIds.forEach((relatedNodeId) => edges.get(id)?.add(relatedNodeId))

        // Interface를 구현하는 Object 타입들에 대한 edge 생성
        const implementingTypes = ast.definitions.filter(
          (def) =>
            def.kind === Kind.OBJECT_TYPE_DEFINITION && def.interfaces?.some((iface) => iface.name.value === name),
        )

        implementingTypes.forEach((implType) => {
          if (implType.kind === Kind.OBJECT_TYPE_DEFINITION) {
            const implTypeId = schemaNodeIdByName.get(implType.name.value)
            if (implTypeId !== undefined) {
              edges.get(id)?.add(implTypeId)
            }
          }
        })
        break
      }
      case Kind.UNION_TYPE_DEFINITION: {
        const { types } = definitionNode

        if (types === undefined || types.length === 0) {
          console.log(`${name} has no types`)
          continue
        }

        // Union에 포함된 Object 타입들에 대한 edge 생성
        types.forEach((typeNode) => {
          const typeId = schemaNodeIdByName.get(typeNode.name.value)
          if (typeId !== undefined) {
            edges.get(id)?.add(typeId)
          }
        })
        break
      }
      case Kind.OBJECT_TYPE_DEFINITION: {
        const { fields } = definitionNode

        if (fields === undefined) {
          console.log(`${name} has not fields`)
          continue
        }

        const relatedNodeIds = getTypeSchemaNodeRelatedSchemaNodeIds({
          parentNodeName: name,
          fields: Array.from(fields),
          schemaNodeIdByName,
        })

        relatedNodeIds.forEach((relatedNodeId) => edges.get(id)?.add(relatedNodeId))
        break
      }
      case Kind.INPUT_OBJECT_TYPE_DEFINITION: {
        const { fields } = definitionNode

        if (fields === undefined) {
          console.log(`${name} has not fields`)
          break
        }

        const relatedNodeIds = getInputSchemaNodeRelatedSchemaNodeIds(Array.from(fields), schemaNodeIdByName)

        relatedNodeIds.forEach((relatedNodeId) => edges.get(id)?.add(relatedNodeId))
        break
      }
    }
  }

  console.log('generated edges')
  return edges
}
