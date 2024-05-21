import { DocumentNode, Kind, ScalarTypeDefinitionNode, visit } from 'graphql'

export const filterOnlyVisitedSchema = ({
  ast,
  visitedSchemaNodeNames,
  schemaNodeNamesToExclude,
  customScalarName,
}: {
  ast: DocumentNode,
  visitedSchemaNodeNames: Set<String>,
  schemaNodeNamesToExclude ? : Set<String>,
  customScalarName ? : string
}) => {
  return visit(ast, {
    /**
     * 방문한 기록이 있는 node만 남깁니다.
     * */
    enter(node) {
      if (
        !(
          node.kind === Kind.DIRECTIVE_DEFINITION ||
          node.kind === Kind.SCALAR_TYPE_DEFINITION ||
          node.kind === Kind.ENUM_TYPE_DEFINITION ||
          node.kind === Kind.OBJECT_TYPE_DEFINITION ||
          node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION
        )
      ) {
        return node;
      }

      const {
        name: { value: name },
      } = node;

      if (!visitedSchemaNodeNames.has(name)) return null;

      return node;
    },
    /**
     * 제외해야 하는 node를 custom scalar로 바꾸어 줍니다.
     * */
    NamedType (node) {
      if (
        !schemaNodeNamesToExclude ||
        !customScalarName ||
        schemaNodeNamesToExclude.size === 0 ||
        customScalarName.length === 0
      ) {
        return node;
      }

      if (schemaNodeNamesToExclude.has(node.name.value)) {
        return {
          ...node,
          name: {
            ...node.name,
            value: customScalarName,
          },
        };
      }
      return node;
    }
  });
};

/**
 * 스키마에 custom scalar type을 추가합니다.
 * */
export const addCustomScalarType = ({
  ast,
  customScalarName
}: {
  ast: DocumentNode,
  customScalarName?: string
}) => {
  if (!customScalarName) {
    return ast;
  }

  const scalarTypeDefinitionNode: ScalarTypeDefinitionNode = {
    kind: Kind.SCALAR_TYPE_DEFINITION,
    name: {
      kind: Kind.NAME,
      value: customScalarName,
    },
  };

  const newAstDefinitions = [...ast.definitions, scalarTypeDefinitionNode]

  return {
    ...ast,
    definitions: newAstDefinitions,
  };
}
