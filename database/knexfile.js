module.exports = {
  development: {
    client: 'pg',
    connection: { database: 'sds_dev', user: 'postgres' },
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  }
};
