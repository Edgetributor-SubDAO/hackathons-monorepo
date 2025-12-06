import { readFileSync } from 'fs';
import { join } from 'path';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from '../resolvers';

const typeDefs = readFileSync(
  join(__dirname, 'schema.graphql'),
  'utf-8'
);

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

