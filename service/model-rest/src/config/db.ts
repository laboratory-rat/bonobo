const create = (): DBConfig => ({
    connectionString: process.env.DB_CONNECTION_STRING,
    db: process.env.DB_DATABASE ?? 'msModelRest',
});

interface DBConfig {
    connectionString: string;
    db: string;
}

let instance: DBConfig | null = null;

export const createDbConfig = (): DBConfig => {
    if (!instance) {
        instance = create();
    }

    return instance;
};
