import { DocumentNode, Kind, visit } from 'graphql'

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
          node.kind === Kind.OBJECT_TYPE_DEFINITION ||
          node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION
        )
      ) {
        return node;
      }

      /**
       * interface를 implement하는 type이라면, API에서 방문하지 않을 수 있습니다.
       * 따라서 강제로 추가해 줍니다.
       */
      if (node.kind == Kind.OBJECT_TYPE_DEFINITION && node.interfaces.length > 0) {
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
