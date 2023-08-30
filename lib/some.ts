import { readFileSync, writeFileSync } from "fs";
import { parse, print as printSchema } from "graphql";
import path from "path/posix";
import { generateEdges } from "./utilities/edge-initializer";
import { filterOnlyVisitedSchema } from "./utilities/filter";
import { GQL_ROOT_PATH, LIB_GQL_ROOT_PATH } from "./utilities/loader";
import { generateNodes } from "./utilities/node-initializer";
import { filterOperationsToUse } from "./utilities/operation-filter";

/* -------------------------------------------------------------------------- */
/*                                Logic Follows                               */
/* -------------------------------------------------------------------------- */

const visitedIds = new Set<number>();
let visitedSchemaNodeNames = new Set<String>();

/* -------------------------------------------------------------------------- */
/*                                   Setting                                  */
/* -------------------------------------------------------------------------- */

const verbose = false;

const dfs = (schemaNodeId: number, depth: number) => {
  visitedIds.add(schemaNodeId);

  const visitedNodeName = schemaNodeById.get(schemaNodeId).name;

  if (verbose) {
    console.log(" ".repeat(depth) + visitedNodeName);
  }

  const children = edges.get(schemaNodeId);

  if (children === undefined) {
    process.exit();
  }

  if (children.size > 0) {
    children.forEach((child) => {
      if (!visitedIds.has(child)) {
        dfs(child, depth + 1);
      }
    });
  }
};

const findAllReachableSchemaNodeIds = (startingSchemaNodeNames: String[]) => {
  startingSchemaNodeNames.forEach((startingSchemaNodeName) =>
    dfs(schemaNodeIdByName.get(startingSchemaNodeName), 0)
  );

  console.log("found all reachable nodes");

  visitedSchemaNodeNames = new Set<String>(
    Array.from(visitedIds).map(
      (visitedId) => schemaNodeById.get(visitedId).name
    )
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Entry Point                                */
/* -------------------------------------------------------------------------- */

const schema = readFileSync(
  path.join(GQL_ROOT_PATH, "schema-original.graphql"),
  "utf-8"
);
const ast = parse(schema);

/**
 * - type Query
 * - type Mutation
 * - type Subscription
 *
 * 위 3개의 블록에서 원하는 줄만 남기고 삭제한다.
 */

const operationFilteredDocumentNode = filterOperationsToUse(ast);

writeFileSync(
  path.join(GQL_ROOT_PATH, "schema-operation-filtered.graphql"),
  printSchema(operationFilteredDocumentNode)
);

/**
 * Graph 생성
 */

const { schemaNodeById, schemaNodeIdByName } = generateNodes(
  operationFilteredDocumentNode
);

const edges = generateEdges({
  ast: operationFilteredDocumentNode,
  schemaNodeIdByName,
  schemaNodeById,
});

/**
 * Query, Mutation, Subscription 을 시작으로 조회한다!
 *
 * Traverse
 */

const startingSchemaNodeNames = [
  "Query",
  // "Mutation",
  // "Subscription",
];

findAllReachableSchemaNodeIds(startingSchemaNodeNames);

/**
 * Output
 */

const filteredAST = filterOnlyVisitedSchema(
  operationFilteredDocumentNode,
  visitedSchemaNodeNames
);

const filteredSchema = printSchema(filteredAST);

writeFileSync(
  path.join(GQL_ROOT_PATH, "schema-filtered.graphql"),
  filteredSchema
);

writeFileSync(path.join(LIB_GQL_ROOT_PATH, "schema.graphql"), filteredSchema);
