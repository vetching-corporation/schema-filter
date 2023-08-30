import { readFileSync, writeFileSync } from "fs";
import {
  DefinitionNode,
  DocumentNode,
  ExecutableDefinitionNode,
  Kind,
  TypeSystemDefinitionNode,
  TypeSystemExtensionNode,
  parse,
} from "graphql";
import * as path from "path/posix";

export type OperationInUse = {
  name: String;
  inUse: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                Logic Follows                               */
/* -------------------------------------------------------------------------- */

const kindCounts: Map<Kind, number> = new Map<Kind, number>();

/* -------------------------------------------------------------------------- */
/*                                   Setting                                  */
/* -------------------------------------------------------------------------- */

const isTypeSystemExtensionNode = (
  node: DefinitionNode
): node is TypeSystemExtensionNode => {
  return (
    node.kind === Kind.SCHEMA_EXTENSION ||
    node.kind === Kind.SCALAR_TYPE_EXTENSION ||
    node.kind === Kind.OBJECT_TYPE_EXTENSION ||
    node.kind === Kind.INTERFACE_TYPE_EXTENSION ||
    node.kind === Kind.UNION_TYPE_EXTENSION ||
    node.kind === Kind.ENUM_TYPE_EXTENSION ||
    node.kind === Kind.INPUT_OBJECT_TYPE_EXTENSION
  );
};

const isExecutableDefinitionNode = (
  node: DefinitionNode
): node is ExecutableDefinitionNode => {
  return (
    node.kind === Kind.OPERATION_DEFINITION ||
    node.kind === Kind.FRAGMENT_DEFINITION
  );
};

const isTypeSystemDefinitionNode = (
  node: DefinitionNode
): node is TypeSystemDefinitionNode => {
  return (
    node.kind === Kind.SCHEMA_DEFINITION ||
    node.kind === Kind.SCALAR_TYPE_DEFINITION ||
    node.kind === Kind.OBJECT_TYPE_DEFINITION ||
    node.kind === Kind.INTERFACE_TYPE_DEFINITION ||
    node.kind === Kind.UNION_TYPE_DEFINITION ||
    node.kind === Kind.ENUM_TYPE_DEFINITION ||
    node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ||
    node.kind === Kind.DIRECTIVE_DEFINITION
  );
};

const existingUsageMap = new Map<String, boolean>();

const lookForExistingOperations = () => {
  const queries: OperationInUse[] = JSON.parse(
    readFileSync(path.join("gql", "Query.json"), "utf-8")
  );

  const mutations: OperationInUse[] = JSON.parse(
    readFileSync(path.join("gql", "Mutation.json"), "utf-8")
  );

  const subscriptions: OperationInUse[] = JSON.parse(
    readFileSync(path.join("gql", "Subscription.json"), "utf-8")
  );

  [...queries, ...mutations, ...subscriptions].forEach((operation) =>
    existingUsageMap.set(operation.name, operation.inUse)
  );
};

/**
 * Query, Mutation, Subscription 목록을 가져오자.
 */
const lookForExecutableDefinitionNodes = (ast: DocumentNode) => {
  const definitionNodes = ast.definitions;
  for (let index = 0; index < definitionNodes.length; index++) {
    const definitionNode = definitionNodes.at(index);

    if (!definitionNode) {
      console.log("definitionNode not found");

      process.exit();
    }

    kindCounts.set(
      definitionNode.kind,
      (kindCounts.get(definitionNode.kind) ?? 0) + 1
    );

    if (isTypeSystemExtensionNode(definitionNode)) {
      continue;
    }

    if (isExecutableDefinitionNode(definitionNode)) {
      continue;
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
          continue;
        case Kind.OBJECT_TYPE_DEFINITION:
          const typeName = definitionNode.name.value;

          if (fieldLevelLookUpTypeNames.has(typeName)) {
            const operationInUse: OperationInUse[] = [];

            definitionNode.fields?.forEach((field) => {
              const fieldName = field.name.value;

              operationInUse.push({
                inUse: true,
                // existingUsageMap.get(fieldName) ?? fieldName === "Mutation"
                //   ? false
                //   : fieldName === "Subscription"
                //   ? false
                //   : true,
                name: fieldName,
              });
            });

            writeFileSync(
              path.join(outputPath, `${typeName}.json`),
              JSON.stringify(operationInUse, undefined, 2)
            );
          }
      }
    }
  }
};

/* -------------------------------------------------------------------------- */
/*                                 Entry Point                                */
/* -------------------------------------------------------------------------- */

const schema = readFileSync(
  path.join("gql", "schema-original.graphql"),
  "utf-8"
);
const ast = parse(schema);
const outputPath = "./gql";
const fieldLevelLookUpTypeNames: Set<String> = new Set<String>([
  "Query",
  // "Mutation",
  // "Subscription",
]);

// lookForExistingOperations();

lookForExecutableDefinitionNodes(ast);
