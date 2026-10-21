import { type EventStore, VersionConflictError } from "@hexmote/application";
import type { CanvasEvent } from "@hexmote/domain";

type CreateSqliteEventStore = (storage: DurableObjectStorage) => EventStore;

type EventRow = { payload: string };
type VersionRow = { version: number };

export const createSqliteEventStore: CreateSqliteEventStore = (storage) => {
  const { sql } = storage;
  sql.exec(`CREATE TABLE IF NOT EXISTS events (
    version INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    recorded_at INTEGER NOT NULL
  )`);

  const currentVersion = () =>
    sql.exec<VersionRow>("SELECT COALESCE(MAX(version), 0) AS version FROM events").one().version;

  const store: EventStore = {
    read: async () => {
      const events = sql
        .exec<EventRow>("SELECT payload FROM events ORDER BY version")
        .toArray()
        .map(({ payload }) => JSON.parse(payload) as CanvasEvent);
      const stored = { events, version: events.length };

      return stored;
    },
    // One SQLite transaction: a version conflict or a failed insert rolls back every row.
    append: async ({ events, expectedVersion }) => {
      storage.transactionSync(() => {
        const actualVersion = currentVersion();
        if (actualVersion !== expectedVersion) {
          throw new VersionConflictError({ expectedVersion, actualVersion });
        }
        const recordedAt = Date.now();
        for (const [index, event] of events.entries()) {
          sql.exec(
            "INSERT INTO events (version, type, payload, recorded_at) VALUES (?, ?, ?, ?)",
            expectedVersion + index + 1,
            event.type,
            JSON.stringify(event),
            recordedAt,
          );
        }
      });
    },
  };

  return store;
};
