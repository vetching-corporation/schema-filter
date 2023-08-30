import { DocumentNode, Kind, visit } from "graphql";

export const filterOnlyVisitedSchema = (
  ast: DocumentNode,
  visitedSchemaNodeNames: Set<String>
) => {
  return visit(ast, {
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
  });
};
