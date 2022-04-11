const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const utils = require("../../controllers/utils");
const itemsController = require("../../controllers/items/items-controller");

// получение всех Employees пользователя
router.get("/", utils.isTokenValid, itemsController.all);

// добавление Employee
router.post("/add", utils.isTokenValid, async (req, res) => {
    const { f_name, s_name, mobile, add_order_supplier } = req.body;

    if (!f_name?.length < 3 || s_name?.length < 3 || mobile?.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    const options = { ...req.body }

    options.order_supplier = JSON.stringify(add_order_supplier);
    delete options.add_order_supplier;
    // отправка запроса
    prisma.employees.create({ id_user: req.token.id, ...options })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение Employee по айди
router.get("/:id", utils.isTokenValid, (req, res) => {
    // отправка запроса
    prisma.employees.findUnique({ where: { id: req.params.id } })
        .then((result) => {
            if (!result) return res.json({ status: "error", message: "Unknow id" });
            // проверка на пренадлежность клиента к пользователю
            if (result.id_user !== req.token.id) {
                return res.json({ status: "error", message: "Action not allowed" });
            }

            result.order_supplier = JSON.parse(elem?.order_supplier || `[]`)

            res.json({ status: "OK", message: elem });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// редактирование Employee
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    const { f_name, s_name, mobile, add_order_supplier } = req.body;

    if (!f_name?.length < 3 || s_name?.length < 3 || mobile?.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    const options = { ...req.body }

    options.order_supplier = JSON.stringify(add_order_supplier);
    delete options.add_order_supplier;
    // отправка запроса
    prisma.employees.update({ data: { ...req.body }, where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление Employee
router.post("/:id/remove", utils.isTokenValid, itemsController.delete);

module.exports = router;

