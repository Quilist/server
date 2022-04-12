const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const itemsController = require("../../controllers/items/items-controller");

// получение всех LegalEntites юрлиц
router.get("/", itemsController.all);

// добавление LegalEntites
router.post("/add", async (req, res) => {
    const { mobile, name } = req.body;

    if (name?.length < 3 || mobile?.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }
    // отправка запроса
    prisma.legal_entites.create({ id_user: req.token.id, ...req.body })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение LegalEntites по айди
router.get("/:id", itemsController.id);

// редактирование LegalEntites
router.post("/:id/edit", async (req, res) => {
    const { mobile, name } = req.body;

    if (name?.length < 3 || mobile?.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }
    // отправка запроса
    prisma.legal_entites.update({ ...req.body }, { where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление LegalEntites
router.post("/:id/remove", itemsController.delete);

module.exports = router;