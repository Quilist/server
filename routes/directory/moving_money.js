const express = require("express");

const prisma = require("../../database/database");
const router = express.Router();

router.post("/add", async (req, res) => {
  const dateMs = String(Date.now());

  if (Number.isInteger(req.body.created_at)) {
    req.body.created_at = String(req.body.created_at)
  }

  const data = {
    ...req.body,
    id_user: req.token.id,
    updated_at: dateMs
  }

  if (req.body.created_at === "NaN") {
    data.created_at = String(dateMs)
  }

  try {
    await prisma.moving_money.create({ data: data });

    res.json({ status: "OK", message: "Success" });
  } catch (e) {
    res.json({ status: "error", message: e.message });
  }
});

module.exports = router;