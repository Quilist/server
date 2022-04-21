const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const itemsController = require("../../controllers/items/items-controller");
const itemsService = require("../../controllers/items/items-service");

// получение всех currencies пользователя
router.get("/", async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    itemsService.all(page, limit, "user_currencies", req.token)
        .then(result => res.json({ status: "OK", message: result }))
        .catch(e => res.json({ status: "error", message: e.message }));
});

// получение all_currencies
router.get("/auxiliary/data", async (req, res) => {
    prisma.currency.findMany({ where: { id_user: req.token.id } })
        .then(result => res.json({ status: "OK", message: result }))
        .catch(e => res.json({ status: "error", message: e.message }));
});

// добавление currencies
router.post("/add", async (req, res) => {
    const { from_currency_id, to_currency_id } = req.body;

    if (from_currency_id === to_currency_id) {
        return res.json({ status: "error", message: "Value one cannot be equal to value two" });
    }

    prisma.user_currencies.findMany({ where: { id_user: req.token.id } })
        .then(result => {
            // проверка на то, есть ли валютная пара с таким курсом
            const index = result.findIndex(el => {
                if (el.from_currency_id === from_currency_id &&
                    el.to_currency_id === to_currency_id) return true;
            });

            if (index !== -1) return res.json({ status: "error", message: "Currency pair already in use" });

            const dateMs = String(Date.now());

            const options = {
                ...req.body,
                id_user: req.token.id,
                created_at: dateMs,
                updated_at: dateMs
            }

            prisma.user_currencies.create({ data: options })
                .then(() => res.json({ status: "OK", message: "Succes" }))
                .catch(e => res.json({ status: "error", message: e.message }));
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

router.get("/:id", (req, res) => {
    itemsService.id("user_currencies", Number(req.params.id), req.token)
        .then(result => res.json({ status: "OK", message: result }))
        .catch(e => res.json({ status: "error", message: e.message }));
});

router.post("/:id/edit", (req, res) => {
    itemsService.edit("user_currencies", req.body, Number(req.params.id), req.token)
        .then(result => res.json({ status: "OK", message: result }))
        .catch(e => res.json({ status: "error", message: e.message }));
});
router.post("/:id/remove", (req, res) => {
    itemsService.delete("user_currencies", Number(req.params.id), req.token)
        .then(result => res.json({ status: "OK", message: result }))
        .catch(e => res.json({ status: "error", message: e.message }));
});

module.exports = router;


