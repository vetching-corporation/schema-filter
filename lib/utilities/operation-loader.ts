import { existsSync, readFileSync } from 'fs'
import { join } from 'path/posix'
import { Operation } from '../types/operation'
import { cofiguration } from './caller-configuration-parser'

export const loadQueries = (): Operation[] => {
  const path = join(cofiguration.filters, 'Query.json')

  console.log(`loading Query filter from ${path}`)

  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : []
}

export const loadMutations = (): Operation[] => {
  const path = join(cofiguration.filters, 'Mutation.json')

  console.log(`loading Mutation filter from ${path}`)

  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : []
}

export const loadSubscriptions = (): Operation[] => {
  const path = join(cofiguration.filters, 'Subscription.json')

  console.log(`loading Subscription filter from ${path}`)

  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : []
}

export const loadOperations = (): Operation[] => {
  return [...loadQueries(), ...loadMutations(), ...loadSubscriptions()]
}
