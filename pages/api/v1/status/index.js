import database from "infra/database.js";

export default async function status(request, response) {
  const updatedAt = new Date().toISOString();

  const databaseName = process.env.POSTGRES_DB;

  const [
    {
      value: {
        rows: [{ server_version: postgresVersion }],
      },
    },
    {
      value: {
        rows: [{ max_connections: maxConnections }],
      },
    },
    {
      value: {
        rows: [{ count: openedConnections }],
      },
    },
  ] = await Promise.allSettled([
    await database.query("SHOW server_version;"),
    await database.query("SHOW MAX_CONNECTIONS;"),
    await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    }),
  ]);

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: postgresVersion,
        max_connections: parseInt(maxConnections),
        opened_connections: openedConnections,
      },
    },
  });
}
