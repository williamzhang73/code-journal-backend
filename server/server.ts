/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import { ClientError, authMiddleware, errorMiddleware } from './lib/index.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const hashKey = process.env.TOKEN_SECRET;
if (!hashKey) throw new Error('TOKEN_SECRET not found in .env');

const app = express();
app.use(express.json());

app.get('/api/entries', authMiddleware, async (req, res, next) => {
  try {
    const sql = `
      select *
        from "entries"
        where "userId" = $1;
      `;
    const result = await db.query(sql, [req.user?.userId]);
    const entries = result.rows;
    res.status(200).json(entries);
  } catch (err) {
    next(err);
  }
});

app.get('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  try {
    const { entryId } = req.params;
    if (!entryId) throw new ClientError(400, 'entryId is required');
    if (!Number.isInteger(+entryId))
      throw new ClientError(400, 'entryId must be an integer');
    const sql = `
      select *
        from "entries" where "entryId"=$1
        where "userId" = $2;
      `;
    const params = [entryId, req.user?.userId];
    const result = await db.query(sql, params);
    const [row] = result.rows;
    if (!row) throw new ClientError(404, 'entryId not found.');
    res.status(200).json(row);
  } catch (err) {
    next(err);
  }
});

app.post('/api/entries/:userId', authMiddleware, async (req, res, next) => {
  try {
    const { title, notes, photoUrl } = req.body;
    if (!title) throw new ClientError(400, 'title is required');
    if (!notes) throw new ClientError(400, 'notes is required');
    if (!photoUrl) throw new ClientError(400, 'photoUrl is required');
    const sql = `
      insert into "entries" ("title", "notes", "photoUrl")
        values ($1, $2, $3)
        where "userId" = $4
        returning *;
        `;
    const params = [title, notes, photoUrl, req.user?.userId];
    const results = await db.query(sql, params);
    const [newEntry] = results.rows;
    res.status(201).json(newEntry);
  } catch (err) {
    next(err);
  }
});

app.put('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const { title, notes, photoUrl } = req.body;
    if (!entryId) throw new ClientError(400, 'entryId is required');
    if (!title) throw new ClientError(400, 'title is required');
    if (!notes) throw new ClientError(400, 'notes is required');
    if (!photoUrl) throw new ClientError(400, 'photoUrl is required');
    const sql = `
      update "entries" set "title"=$1, "notes"=$2, "photoUrl"=$3
      where "entryId"=$4 and "userId" = $5
      returning *;`;
    const params = [title, notes, photoUrl, entryId, req.user?.userId];
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
        where "entryId" = $1 and "userId" = $2
        returning *;
        `;
    const params = [entryId, req.user?.userId];
    const result = await db.query(sql, params);
    const [deletedEntry] = result.rows;
    if (!deletedEntry)
      throw new ClientError(404, `entryId ${entryId} not found`);
    res.status(204).json(deletedEntry);
  } catch (err) {
    next(err);
  }
});

app.post('/api/users/sign-up', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username) throw new ClientError(400, 'username is required');
    if (!password) throw new ClientError(400, 'password is required');
    const sql = `insert into "users" ("username", "hashedPassword")
                 values ($1, $2)
                 returning *; `;
    const hashedPassword = await argon2.hash(password);
    const result = await db.query(sql, [username, hashedPassword]);
    const [row] = result.rows;
    res.status(201).json(row);
  } catch (error) {
    console.log(`sign up failed`);
    next();
  }
});

app.post('/api/users/sign-in', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username) throw new ClientError(400, 'username is required');
    if (!password) throw new ClientError(400, 'password is required');
    const sql = `
      select "userId", "hashedPassword"
        from "users"
        where "username" = $1;
        `;
    const params = [username];
    const results = await db.query(sql, params);
    const [user] = results.rows;
    if (!user) throw new ClientError(404, `user ${user.userId} not found`);
    const verify = await argon2.verify(user.hashedPassword, password);
    if (!verify) throw new ClientError(401, 'invalid login credentials');
    const payload = { userId: user.userId, username: user.username };
    const token = jwt.sign(payload, hashKey);
    res.status(200).json({ user: payload, token });
  } catch (err) {
    next(err);
  }
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
