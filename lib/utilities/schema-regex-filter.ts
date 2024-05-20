import { configuration } from './caller-configuration-parser'

export const checkIfInputToExclude = (schemaNodeName: string): boolean => {
  const customMapScalarName: string[] = configuration['node-name-regexes-to-exclude']

  if (!customMapScalarName || customMapScalarName.length === 0) {
    return false
  }

  const regexes = customMapScalarName.map((regex) => new RegExp(regex))

  return regexes.some((regex) => regex.test(schemaNodeName))
}

export const getRegexFilteredSchema = (schemaNodeNamesToExclude: string[], schema: string): string => {
  let filteredSchema = schema

  filteredSchema = replaceExcludedInputsFromSchema(schemaNodeNamesToExclude, filteredSchema)

  filteredSchema = addCustomScalar(filteredSchema)

  return filterRegex(schemaNodeNamesToExclude, filteredSchema)
}

/* -------------------------------------------------------------------------- */
/*                              Private Functions                             */
/* -------------------------------------------------------------------------- */

const filterRegex = (schemaNodeNamesToExclude: string[], schema: string) => {
  const modifiedText = schema.split('\n\n').map(typeDef => {
    const nodeName = typeDef.match(/input\s+(\w+)\s*\{/)?.[1];
    return nodeName && schemaNodeNamesToExclude.includes(nodeName) ? `` : typeDef;
  }).join('\n\n');

  return modifiedText;
}

const replaceExcludedInputsFromSchema = (schemaNodeNamesToExclude: string[], filteredSchema: string): string => {
  let arrangedSchema = filteredSchema

  const customMapScalarName = configuration['replacing-custom-scalar-name']

  if (customMapScalarName === undefined || customMapScalarName === '') {
    return arrangedSchema
  }

  schemaNodeNamesToExclude.forEach((schemaNodeName) => {
    arrangedSchema = arrangedSchema.replaceAll(`: ${schemaNodeName}`, `: ${customMapScalarName}`)
    arrangedSchema = arrangedSchema.replaceAll(`: [${schemaNodeName}`, `: [${customMapScalarName}`)
  })

  return arrangedSchema
}

const addCustomScalar = (schema: string): string => {
  const customMapScalarName = configuration['replacing-custom-scalar-name']

  if (customMapScalarName === undefined || customMapScalarName === '') {
    return schema
  }

  return schema + `\n\nscalar ${customMapScalarName}\n`;
}