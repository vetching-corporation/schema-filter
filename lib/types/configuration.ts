export type Configuration = {
  'schema-original': string
  filters: string
  'schema-reduced': string
  'batch-setting': {
    query: boolean
    mutation: boolean
    subscription: boolean
  }
  'input-type-name-regexes-to-remove': string[]
  'custom-scalar-name': string
}
