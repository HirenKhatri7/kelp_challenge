import { pool } from "../config/db.js";

function prepareRecord(record) {
  const first = record?.name?.firstName ?? "";
  const last = record?.name?.lastName ?? "";
  const age = parseInt(record?.age ?? "0", 10);

  const address = record?.address ?? null;


  const additional = structuredClone(record);
  delete additional.name;
  delete additional.age;
  delete additional.address;

  return {
    name: `${first} ${last}`.trim(),
    age,
    address,
    additional,
  };
}

async function insertBatch(client, batch) {
  if (!batch.length) return;

  const values = [];
  const placeholders = batch
    .map((r, i) => {
      const idx = i * 4;
      values.push(r.name, r.age, r.address ? JSON.stringify(r.address) : null, Object.keys(r.additional).length ? JSON.stringify(r.additional) : null);
      return `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4})`;
    })
    .join(", ");

  const query = `
    INSERT INTO users("name", age, address, additional_info)
    VALUES ${placeholders};
  `;
  await client.query(query, values);
}

export async function importUsers(records, batchSize = 1000) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let batch = [];
    for await (const convRecord of records) {
      const record = prepareRecord(convRecord);
      if (!record.name || !record.age) continue;
      batch.push(record);
      if (batch.length >= batchSize) {
        await insertBatch(client, batch);
        batch = [];
      }
    }
    if (batch.length) await insertBatch(client, batch);

    await client.query("COMMIT");
    console.log("Transaction completed successfully.");
    await printAgeDistribution(client);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction failed:", err.message);
  } finally {
    client.release();
  }
}

async function printAgeDistribution(client) {
  const { rows } = await client.query(`
    SELECT
      SUM(CASE WHEN age < 20 THEN 1 ELSE 0 END) AS lt20,
      SUM(CASE WHEN age BETWEEN 20 AND 40 THEN 1 ELSE 0 END) AS g20_40,
      SUM(CASE WHEN age BETWEEN 41 AND 60 THEN 1 ELSE 0 END) AS g40_60,
      SUM(CASE WHEN age > 60 THEN 1 ELSE 0 END) AS gt60,
      COUNT(*) AS total
    FROM users;
  `);

  const r = rows[0];
  const pct = (x) => ((x / r.total) * 100).toFixed(2);

  console.log("\n📊 Age Distribution:");
  console.log(" < 20     :", pct(r.lt20), "%");
  console.log(" 20 - 40  :", pct(r.g20_40), "%");
  console.log(" 40 - 60  :", pct(r.g40_60), "%");
  console.log(" > 60     :", pct(r.gt60), "%");
}
