import { DocumentNode, Kind, ScalarTypeDefinitionNode } from 'graphql/index'

/**
 * 스키마에 custom scalar type을 추가합니다.
 * */
export const addCustomScalarType = ({
  ast,
  customScalarName,
}: {
  ast: DocumentNode,
  customScalarName?: string
}) => {
  if (!customScalarName) {
    return ast
  }

  const scalarTypeDefinitionNode: ScalarTypeDefinitionNode = {
    kind: Kind.SCALAR_TYPE_DEFINITION,
    name: {
      kind: Kind.NAME,
      value: customScalarName,
    },
  }

  const newAstDefinitions = [...ast.definitions, scalarTypeDefinitionNode]

  return {
    ...ast,
    definitions: newAstDefinitions,
  }
}