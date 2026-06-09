import express from "express";
import {
  createMemo,
  deleteMemoById,
  getMemoById,
  getMemos,
  updateMemoById,
} from "../db.js";

const router = express.Router();

function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

function sendError(res, message, status = 400) {
  res.status(status).json({ success: false, message });
}

function parseMemoId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizePinned(value) {
  return value === true || value === 1 || value === "1" ? 1 : 0;
}

router.get("/", (req, res) => {
  const rawLimit = Number(req.query.limit);
  const limit = Number.isInteger(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 100)
    : 20;
  const sort = req.query.sort === "asc" ? "ASC" : "DESC";

  getMemos({ limit, sort }, (err, rows) => {
    if (err) return sendError(res, "db error", 500);
    return sendSuccess(res, rows);
  });
});

router.get("/:id", (req, res) => {
  const id = parseMemoId(req.params.id);
  if (!id) return sendError(res, "invalid id", 400);

  getMemoById(id, (err, row) => {
    if (err) return sendError(res, "db error", 500);
    if (!row) return sendError(res, "memo not found", 404);
    return sendSuccess(res, row);
  });
});

router.post("/", (req, res) => {
  const title = req.body?.title?.trim();
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  const imageUrl = typeof req.body?.image_url === "string" ? req.body.image_url : null;
  const pinned = normalizePinned(req.body?.pinned);

  if (!title) return sendError(res, "title is required", 400);

  createMemo({ title, content, pinned, imageUrl }, (err, id) => {
    if (err) return sendError(res, "db error", 500);
    return sendSuccess(res, { id }, 201);
  });
});

router.put("/:id", (req, res) => {
  const id = parseMemoId(req.params.id);
  if (!id) return sendError(res, "invalid id", 400);

  const title = req.body?.title?.trim();
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  const imageUrl = typeof req.body?.image_url === "string" ? req.body.image_url : null;
  const pinned = normalizePinned(req.body?.pinned);

  if (!title) return sendError(res, "title is required", 400);

  updateMemoById(id, { title, content, pinned, imageUrl }, (err, changes) => {
    if (err) return sendError(res, "db error", 500);
    if (changes === 0) return sendError(res, "memo not found", 404);
    return sendSuccess(res, { id });
  });
});

router.delete("/:id", (req, res) => {
  const id = parseMemoId(req.params.id);
  if (!id) return sendError(res, "invalid id", 400);

  deleteMemoById(id, (err, changes) => {
    if (err) return sendError(res, "db error", 500);
    if (changes === 0) return sendError(res, "memo not found", 404);
    return sendSuccess(res, { id });
  });
});

export default router;