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
        .then(result => {
            console.log(result)
            res.json({ status: "OK", message: result })})
        .catch(e => res.json({ status: "error", message: e.message }));
});

// получение all_currencies
router.get("/auxiliary/data", async (req, res) => {
    const currency = [
        {
            id: 1,
            name: "гривна",
            represent: "uan"
        },
        {
            id: 2,
            name: "швейцарский франк",
            represent: "chf"
        },
        {
            id: 3,
            name: "доллар",
            represent: "usd"
        },
        {
            id: 4,
            name: "евро",
            represent: "eur"
        },
    ];

    res.json({ status: "OK", message: currency });
});

// добавление currencies
router.post("/add", async (req, res) => {
    const { id_from_currencies, id_to_currencies } = req.body;

    if (id_from_currencies === id_to_currencies) {
        return res.json({ status: "error", message: "Value one cannot be equal to value two" });
    }

    prisma.user_currencies.findMany({ where: { id_user: req.token.id } })
        .then(result => {
            // проверка на то, есть ли валютная пара с таким курсом
            const index = result.findIndex(el => {
                if (el.id_from_currencies === id_from_currencies &&
                    el.id_to_currencies === id_to_currencies) return true;
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

router.get("/:id", itemsController.id);
router.post("/:id/edit", itemsController.edit);
router.post("/:id/remove", itemsController.delete);

module.exports = router;


