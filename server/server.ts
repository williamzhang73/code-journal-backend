/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import { ClientError, errorMiddleware } from './lib/index.js';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();
app.use(express.json());

app.get('/api/entries', async (req, res, next) => {
  try {
    const sql = `
      select *
        from "entries";
      `;
    const result = await db.query(sql);
    const entries = result.rows;
    res.status(200).json(entries);
  } catch (err) {
    next(err);
  }
});

app.get('/api/entries/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!entryId) throw new ClientError(400, 'entryId is required');
    if (!Number.isInteger(+entryId))
      throw new ClientError(400, 'entryId must be an integer');
    const sql = `
      select *
        from "entries" where "entryId"=$1;
      `;
    const params = [entryId];
    const result = await db.query(sql, params);
    const [row] = result.rows;
    if (!row) throw new ClientError(404, 'entryId not found.');
    res.status(200).json(row);
  } catch (err) {
    next(err);
  }
});

app.post('/api/entries', async (req, res, next) => {
  try {
    const { title, notes, photoUrl } = req.body;
    if (!title) throw new ClientError(400, 'title is required');
    if (!notes) throw new ClientError(400, 'notes is required');
    if (!photoUrl) throw new ClientError(400, 'photoUrl is required');
    const sql = `
      insert into "entries" ("title", "notes", "photoUrl")
        values ($1, $2, $3)
        returning *;
        `;
    const params = [title, notes, photoUrl];
    const results = await db.query(sql, params);
    const [newEntry] = results.rows;
    res.status(201).json(newEntry);
  } catch (err) {
    next(err);
  }
});

app.put('/api/entries/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const { title, notes, photoUrl } = req.body;
    if (!entryId) throw new ClientError(400, 'entryId is required');
    if (!title) throw new ClientError(400, 'title is required');
    if (!notes) throw new ClientError(400, 'notes is required');
    if (!photoUrl) throw new ClientError(400, 'photoUrl is required');
    const sql = `
      update "entries" set "title"=$1, "notes"=$2, "photoUrl"=$3
      where "entryId"=$4
      returning *;`;
    const params = [title, notes, photoUrl, entryId];
    const results = await db.query(sql, params);
    const [updateEntry] = results.rows;
    if (!updateEntry) throw new ClientError(404, 'entryId not found');
    res.status(201).json(updateEntry);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/entries/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, 'invalid entryId, must be an integer');
    }
    const sql = `
      delete
        from "entries"
        where "entryId" = $1
        returning *;
        `;
    const params = [entryId];
    const result = await db.query(sql, params);
    const [deletedEntry] = result.rows;
    if (!deletedEntry)
      throw new ClientError(404, `entryId ${entryId} not found`);
    res.status(204).json(deletedEntry);
  } catch (err) {
    next(err);
  }
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
