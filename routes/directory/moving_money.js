const express = require("express");

const prisma = require("../../database/database");
const itemsService = require("../../controllers/items/items-service");
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

router.get("/:id", (req, res) => {
  itemsService.id("moving_money", Number(req.params.id), req.token)
    .then(result => res.json({ status: "OK", message: result }))
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.post("/:id/edit", (req, res) => {
  itemsService.edit("moving_money", req.body, Number(req.params.id), req.token)
    .then(result => res.json({ status: "OK", message: result }))
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.post("/:id/remove", (req, res) => {
  itemsService.delete("moving_money", Number(req.params.id), req.token)
    .then(result => res.json({ status: "OK", message: result }))
    .catch(e => res.json({ status: "error", message: e.message }));
});


module.exports = router;