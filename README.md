# schema-filter

**Tool to reduce schema size**

Given schema, this package extracts all available queries, mutations, subscriptions and then make list of those to determine whether to use each graphql operation, by using that check-list, reduced-schema is generated

### How it works

1.  extracts all available queries, mutations, subscriptions from given schema
2.  generates `check-list` by each operation type (Query, Mutation, Subscription)
3.  toggle on/off single operation in check-list as you wish
4.  generates reduced-schema by using check-list

### How to Use

1.  install package

    ```shell
    yarn add schema-filter
    # or
    npm i schema-filter
    ```

2. add below to your package.json

    ``` json
    "schema-filter": {
       // give your schema "file" path
       "schema-original":"lib/src/gql/schema.graphql",
       
       // give "directory" path to store check-list as you wish
       // you may omit 
       "filter-list":"lib/src/schema-filters/",
       
       // give "file" path to store reduced-schema as you wish
       "schema-reduced":"lib/src/gql/schema-reduced.graphql",
    }
    ```

    - `original-schema` is **necessary**.

      If not given, it won't work.

    - `filter-list` field is **optional**.
      If not given, generated check-list files' path are determined by `original-schema`'s path

      - directory will be same with `original-schema`'s directory
      - directory name will be `schema-filters`
      - `Query.json`, `Mutation.json`, `Subscription.json` will be generated under `schema-filters` directory
      

    - `schema-reduced` field is **optional**.

      If not given, generated-reduced schema file information is determined by `original-schema`'s path

      - directory will be same with `original-schema`'s directory
      - filename will be `schema-reduced.graphql`

3. initialize check-list

    Below command will generate check-list file under `lib/src/gql/check-list.json`

    ``` bash
    npx schema-filter initialize-check-list
    ```

4.   **filter(reduce)** schema using check-list
    
    execute below command **at project root path**

    ```
    npx schema-filter:filter
    ```


5. toggle on/off single operation in check-list

    **How to include operation**

    ``` bash
    npx schema-filter on {operation-name}
    npx schema-filter on {operation-name} -a # call with -a option to filter schema again using new check-list
    ```

    **How to exclude operation**

    ``` bash
    npx schema-filter off {operation-name}
    npx schema-filter off {operation-name} -a # call with -a option to filter schema again using new check-list
    ```

6. if any change is made in check-list, execute below command to filter schema again

    ``` bash
    npx schema-filter filter
    ```

## Further Requirements?

If you need any extra functionality, please make an issue on github or contact me [dev.kyungho@gmail.com]