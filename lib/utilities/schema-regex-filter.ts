import { configuration } from './caller-configuration-parser'

/**
 * node name이 사용자에게서 받은 regex에 걸리는지 확인합니다.
 * */
export const doesNodeNameFitRegex = (schemaNodeName: string): boolean => {
  const customMapScalarName: string[] = configuration['node-name-regexes-to-exclude']

  if (!customMapScalarName || customMapScalarName.length === 0) {
    return false
  }

  const regexes = customMapScalarName.map((regex) => new RegExp(regex))

  return regexes.some((regex) => regex.test(schemaNodeName))
}