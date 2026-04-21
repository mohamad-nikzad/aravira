import postgres from 'postgres';
import * as schema from './schema';
/** Lazy DB client so Next build does not require DATABASE_URL at compile time. */
export declare function getDb(): import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
};
