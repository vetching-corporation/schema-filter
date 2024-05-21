import { DocumentNode, Kind, visit } from "graphql";

export const filterOnlyVisitedSchema = (
  ast: DocumentNode,
  visitedSchemaNodeNames: Set<String>,
  schemaNodeNamesToExclude?: Set<String>,
  customScalarName?: string,
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
    FieldDefinition (node) {
      if (
        !schemaNodeNamesToExclude ||
        !customScalarName ||
        schemaNodeNamesToExclude.size === 0 ||
        customScalarName.length === 0
      ) {
        return node;
      }

      const newArgs = node.arguments.map((arg) => {
        if (arg.type.kind === Kind.NAMED_TYPE && schemaNodeNamesToExclude.has(arg.type.name.value)) {
          return {
            ...arg,
            type: {
              ...arg.type,
              name: { ...arg.type.name, value: customScalarName },
            },
          };
        }
        return arg;
      });
      return {
        ...node,
        arguments: newArgs,
      };
    },
  });
};
