import { BigQuery, Table, TableMetadata } from "@google-cloud/bigquery";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMIN_KEY = process.env.ADMIN_API_KEY || "admin-local-key-123";
const PROD_PROJECT = process.env.BQ_PROD_PROJECT || "learn-trading-app";
const SANDBOX_PROJECT = process.env.BQ_SANDBOX_PROJECT || "mezan-app-sadnbox";
const DATASETS = (process.env.BQ_SYNC_DATASETS || "market_data")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

type SyncResult = {
  dataset: string;
  copied: string[];
  skipped: Array<{ table: string; reason: string }>;
  failed: Array<{ table: string; error: string }>;
};

function isAuthorized(request: Request) {
  return request.headers.get("X-Admin-Key") === ADMIN_KEY;
}

function getClient(projectId?: string) {
  return new BigQuery(projectId ? { projectId } : undefined);
}

async function ensureDataset(
  targetClient: BigQuery,
  sourceClient: BigQuery,
  datasetId: string,
) {
  const sourceDataset = sourceClient.dataset(datasetId, {
    projectId: PROD_PROJECT,
  });
  const targetDataset = targetClient.dataset(datasetId, {
    projectId: SANDBOX_PROJECT,
  });

  const [sourceMeta] = await sourceDataset.getMetadata();
  const [exists] = await targetDataset.exists();
  if (!exists) {
    await targetDataset.create({
      location: sourceMeta.location,
      description: sourceMeta.description,
      labels: sourceMeta.labels,
    });
  }

  return { sourceDataset, targetDataset };
}

function tableType(metadata: TableMetadata): string {
  return String(metadata.type || metadata.tableType || "TABLE").toUpperCase();
}

async function listSourceTables(datasetId: string) {
  const sourceClient = getClient(PROD_PROJECT);
  const { sourceDataset } = await ensureDataset(
    getClient(SANDBOX_PROJECT),
    sourceClient,
    datasetId,
  );
  const [tables] = await sourceDataset.getTables();
  const details = [] as Array<{ table: string; type: string }>;

  for (const table of tables) {
    const [metadata] = await table.getMetadata();
    details.push({ table: table.id || "unknown", type: tableType(metadata) });
  }

  return details.sort((left, right) => left.table.localeCompare(right.table));
}

async function copyTable(sourceTable: Table, targetTable: Table) {
  const [job] = await sourceTable.copy(targetTable, {
    writeDisposition: "WRITE_TRUNCATE",
  });
  await job.promise();
}

async function syncDataset(
  datasetId: string,
  dryRun: boolean,
): Promise<SyncResult> {
  const sourceClient = getClient(PROD_PROJECT);
  const targetClient = getClient(SANDBOX_PROJECT);
  const { sourceDataset, targetDataset } = await ensureDataset(
    targetClient,
    sourceClient,
    datasetId,
  );
  const [tables] = await sourceDataset.getTables();

  const result: SyncResult = {
    dataset: datasetId,
    copied: [],
    skipped: [],
    failed: [],
  };

  for (const sourceTable of tables) {
    const tableName = sourceTable.id || "unknown";
    try {
      const [metadata] = await sourceTable.getMetadata();
      const type = tableType(metadata);
      if (type !== "TABLE" && type !== "SNAPSHOT") {
        result.skipped.push({
          table: tableName,
          reason: `Unsupported table type: ${type}`,
        });
        continue;
      }

      if (dryRun) {
        result.copied.push(tableName);
        continue;
      }

      await copyTable(sourceTable, targetDataset.table(tableName));
      result.copied.push(tableName);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      result.failed.push({ table: tableName, error: message });
    }
  }

  return result;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const datasets = await Promise.all(
      DATASETS.map(async (dataset) => ({
        dataset,
        tables: await listSourceTables(dataset),
      })),
    );

    return NextResponse.json({
      ok: true,
      prodProject: PROD_PROJECT,
      sandboxProject: SANDBOX_PROJECT,
      datasets,
      note: "Copies BigQuery tables only. compute_levels writes to MongoDB and must be run separately.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to inspect BigQuery sync config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let dryRun = false;
  try {
    const body = await request.json().catch(() => ({}));
    dryRun = Boolean(body?.dryRun);
  } catch {
    dryRun = false;
  }

  const startedAt = Date.now();

  try {
    const results = await Promise.all(
      DATASETS.map((dataset) => syncDataset(dataset, dryRun)),
    );
    const copiedTables = results.reduce(
      (sum, item) => sum + item.copied.length,
      0,
    );
    const failedTables = results.reduce(
      (sum, item) => sum + item.failed.length,
      0,
    );
    const skippedTables = results.reduce(
      (sum, item) => sum + item.skipped.length,
      0,
    );

    return NextResponse.json({
      ok: true,
      dryRun,
      prodProject: PROD_PROJECT,
      sandboxProject: SANDBOX_PROJECT,
      elapsedMs: Date.now() - startedAt,
      copiedTables,
      failedTables,
      skippedTables,
      results,
      note: dryRun
        ? "Dry run only. No tables were overwritten in sandbox."
        : "Sandbox BigQuery tables were overwritten from production.",
      computeLevelsNote:
        "compute_levels is not part of this sync because it writes to MongoDB ticker_levels.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "BigQuery sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
