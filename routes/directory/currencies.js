const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const utils = require("../../controllers/utils");
const itemsController = require("../../controllers/items/items-controller");
const itemsService = require("../../controllers/items/items-service");

// получение всех currencies пользователя
router.get("/", utils.isTokenValid, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    itemsService.all(page, limit, "user_currencies")
        .then((res) => res.json({ status: "OK", message: res }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение all_currencies
router.get("/auxiliary", utils.isTokenValid, async (req, res) => {
    prisma.all_currencies.findMany()
        .then((res) => res.json({ status: "OK", message: res }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// добавление currencies
router.post("/add", utils.isTokenValid, async (req, res) => {
    const { id_from_currencies, id_to_currencies } = req.body;

    if (id_from_currencies === id_to_currencies) {
        return res.json({ status: "error", message: "Value one cannot be equal to value two" });
    }

    prisma.user_currencies.findAll({ where: { id_user: req.token.id } })
        .then(result => {
            // проверка на то, есть ли валютная пара с таким курсом
            const index = result.findIndex(el => {
                if (el.id_from_currencies === id_from_currencies &&
                    el.id_to_currencies === id_to_currencies) return true;
            });

            if (index !== -1) return res.json({ status: "error", message: "Currency pair already in use" });

            prisma.user_currencies.create({ data: { id_user: req.token.id, ...req.body } })
                .then(() => res.json({ status: "OK", message: "Succes" }))
                .catch(err => res.json({ status: "error", message: err.message }));
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение currencies по айди
router.get("/:id", utils.isTokenValid, itemsController.id);

// редактирование currencies
router.post("/:id/edit", utils.isTokenValid, itemsController.edit);

// Удаление currencies
router.post("/:id/remove", utils.isTokenValid, itemsController.delete);

module.exports = router;


