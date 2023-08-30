import { readFileSync } from "fs";
import path from "path/posix";
import { OperationInUse } from "./look-up";

export const GQL_ROOT_PATH = "gql/";
export const LIB_GQL_ROOT_PATH = "lib/src/core/data/data_source";

export const loadQueries = (): OperationInUse[] => {
  console.log("loading Queries...");

  return JSON.parse(
    readFileSync(path.join(GQL_ROOT_PATH, "Query.json"), "utf-8")
  );
};

export const loadMutations = (): OperationInUse[] => {
  console.log("loading Mutations...");

  return JSON.parse(
    readFileSync(path.join(GQL_ROOT_PATH, "Mutation.json"), "utf-8")
  );
};

export const loadSubscriptions = (): OperationInUse[] => {
  console.log("loading Subscriptions...");

  return JSON.parse(
    readFileSync(path.join(GQL_ROOT_PATH, "Subscription.json"), "utf-8")
  );
};

export const loadOperations = (): OperationInUse[] => {
  return [...loadQueries(), ...loadMutations(), ...loadSubscriptions()];
};
