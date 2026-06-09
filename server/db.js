import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./server/data/data.db");

export function initDb(callback) {
  db.run(`CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      pinned INTEGER DEFAULT 0,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, callback);
}

export function getMemos(options, callback) {
  const limit = Number.isInteger(options?.limit) ? options.limit : 20;
  const sort = options?.sort === "ASC" ? "ASC" : "DESC";

  db.all(
    `SELECT * FROM memos ORDER BY pinned DESC, id ${sort} LIMIT ?`,
    [limit],
    callback
  );
}

export function getMemoById(id, callback) {
  db.get("SELECT * FROM memos WHERE id = ?", [id], callback);
}

export function createMemo({ title, content, pinned = 0, imageUrl = null }, callback) {
  db.run(
    `INSERT INTO memos (title, content, pinned, image_url)
     VALUES (?, ?, ?, ?)`,
    [title, content, pinned, imageUrl],
    function (err) {
      callback(err, this?.lastID);
    }
  );
}

export function updateMemoById(id, { title, content, pinned, imageUrl }, callback) {
  db.run(
    `UPDATE memos
     SET title = ?,
         content = ?,
         pinned = ?,
         image_url = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, content, pinned, imageUrl, id],
    function (err) {
      callback(err, this?.changes ?? 0);
    }
  );
}

export function deleteMemoById(id, callback) {
  db.run("DELETE FROM memos WHERE id = ?", [id], function (err) {
    callback(err, this?.changes ?? 0);
  });
}

export default db;