# schema-filter

**"Tool to reduce graphql schema size"**

Given schema, this package extracts all available queries, mutations, subscriptions and then **make list of those to determine whether to use each graphql operation**, by using that check-list, reduced-schema is generated.
**Actually-not used operations are not included in final reduced-schema**

- [schema-filter](#schema-filter)
  - [Examples](#examples)
  - [How it works](#how-it-works)
  - [Commands](#commands)
  - [Getting Started](#getting-started)
  - [Contributions](#contributions)
    - [How to Test Locally](#how-to-test-locally)
    - [How to Build](#how-to-build)
- [Further Requirements?](#further-requirements)


## Examples

Feel free to check [example/](./examples/) You may figure out what's happening there.
Given below schema & our generated `Query.json`, `Mutation.json`, `Subscription.json` filter file
(which is also generated/updated by `schema-filter init` command)

``` graphql
type Post {
  id: ID!
  title: String!
  content: String!
}

type Query {
  getPost(id: ID!): Post
  getAllPosts: [Post!]!
}

type Mutation {
  createPost(title: String!, content: String!): Post!
  updatePost(id: ID!, title: String, content: String): Post!
  deletePost(id: ID!): ID!
}

type Subscription {
  postCreated: Post!
  postUpdated(id: ID!): Post!
  postDeleted(id: ID!): ID!
}
```

This package finally generates below reduced-schema
If some types are not used(reachable) in any operations, those types are **excluded** in reduced-schema
*(even though not visible in below example for now, feel sory for that, later I will update this example)*

**Only actually-used operations are included in reduced-schema**

``` graphql
type Post {
  id: ID!
  title: String!
  content: String!
}

type Query {
  getPost(id: ID!): Post
}

type Mutation {
  createPost(title: String!, content: String!): Post!
  deletePost(id: ID!): ID!
}

type Subscription {
  postDeleted(id: ID!): ID!
}
```

## How it works

1.  extracts all available queries, mutations, subscriptions from given schema
2.  generates `filters` for each operation type (`Query`, `Mutation`, `Subscription`)
3.  generates reduced-schema by using filters
4.  **[Further work]** you may include/exclude single operation by name in check-list as you wish

## Commands

For every command, you should add prefix `npx schema-filter` to execute
To show available commands, execute one of below command after installation

``` shell
npx schema-filter
npx schema-filter --help
```

## Getting Started

1.  Install package (one of below command)

    ```shell
    yarn add --dev schema-filter
    # npm i --save schema-filter
    ```

2. Add/Adjust below configuration in your package.json
    
    only **schmea-original is "MANDATORY"**, others are optional

    ``` json
    "schema-filter": {
       // "MANDATORY"
       // give your schema "file" path
       "schema-original":"lib/src/gql/schema.graphql",
       
       // give "directory" path to store filters as you wish
       "filters":"lib/src/schema-filters/",
       
       // give "file" path to store reduced-schema as you wish
       "schema-reduced":"lib/src/gql/schema-reduced.graphql",

       // after initialization of filters, there would be new operations
       // for newly added operations, you can set default behavior (whether to incldue or not)
       // for all operation type, default value is `true`
       "batch-setting": {
         "Query": true,
         "Mutation": false,
         "Subscription": true,
       }
    }
    ```

    ### Mandatory fields
    
    [1] `schema-orginal` : schema **file** path to reduce


    ### Optional fields

    [2] `filters` : **directory** path to store generated filter files
    
     - If not given, generated filter files' path are **determined by `schema-orginal`'s path**
     - Directory will be same with `schema-orginal`'s directory
     - Directory name will be `filters` and filters will be generated under it.
   
    <br>

    [3] `schema-reduced` : **file** path to store reduced schema

    - If not given, generated-reduced schema file information is **determined by `schema-orginal`'s path**
    - Directory will be same with `schema-orginal`'s directory
    - Filename will be `schema-reduced.graphql`

    <br>
    
    [4] `batch-setting` : **default filter value** for newly added operations by operation type
    - After initialization of filters, there would be new operations. for newly added operations, you can set default behavior (whether to incldue or not)
    - For all operation type, default value is `true`

    <br>

3. Initialize/Update filters

    Below command will generate filters file under generated `filters/` directory in `schema-orginal`'s directory or where you set in `package.json`
    If already filters are generated, this command will update filters by adding newly added operations, not touching already generated operations

    ``` shell
    npx schema-filter init
    ```

4.   **filter(reduce)** schema using filters
    
        execute below command **at project root path**

        ```
        npx schema-filter:filter
        ```


5. **[Further Work]** toggle on/off single operation in filters

    **How to include operation**

    ``` shell
    npx schema-filter include {operation-name}
    npx schema-filter include {operation-name} -a # call with -a option to filter schema again using new check-list
    ```

    **How to exclude operation**

    ``` shell
    npx schema-filter exclude {operation-name}
    npx schema-filter exclude {operation-name} -a # call with -a option to filter schema again using new check-list
    ```

6. if any change is made in check-list, execute below command to filter schema again

    ``` shell
    npx schema-filter filter
    ```

## Contributions

### How to Test Locally

1. clone this repository

    ``` shell
    git clone https://github.com/vetching-corporation/schema-filter.git
    ```

1. check below commands in package.json

    ``` shell
    "test:init": "yarn build && node build/index.js init",
    "test:include": "yarn build && node build/index.js include",
    "test:exclude": "yarn build && node build/index.js exclude",
    "test:filter": "yarn build && node build/index.js filter"
    ```

### How to Build

``` shell
yarn cb # clean build
```

# Further Requirements?

If you need any extra functionality, please make an issue on github or contact me [dev.kyungho@gmail.com]