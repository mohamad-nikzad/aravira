type DatabaseUrlOptions = {
    preferDirect?: boolean;
};
export declare function loadDatabaseEnvFiles(): void;
/**
 * Keep the app portable by depending on standard Postgres URLs only.
 * `DATABASE_URL` is the default runtime connection.
 * `DATABASE_URL_DIRECT` is optional and useful for migrations/seeds.
 */
export declare function getDatabaseUrl(options?: DatabaseUrlOptions): string;
export {};
