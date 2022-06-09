const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const itemsController = require("../../controllers/items/items-controller");

// получение всех Employees пользователя
router.get("/", itemsController.all);

// добавление Employee
router.post("/add", async (req, res) => {
    const { f_name, s_name, mobile, add_order_supplier } = req.body;

    if (f_name?.length < 3 || s_name?.length < 3 || mobile?.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    const dateMs = String(Date.now());

    const options = {
      id_user: req.token.id,
      ...req.body,
      created_at: dateMs,
      updated_at: dateMs
    }

    options.order_supplier = JSON.stringify(add_order_supplier);
    delete options.add_order_supplier;

    // отправка запроса
    prisma.employees.create({ data: options })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => {
            res.json({ status: "error", message: err.message })
            console.log(err.message)
        });
});

// получение Employee по айди
router.get("/:id", (req, res) => {
    // отправка запроса
    prisma.employees.findUnique({ where: { id: Number(req.params.id) } })
        .then((result) => {
            if (!result) return res.json({ status: "error", message: "Unknow id" });
            // проверка на пренадлежность клиента к пользователю
            if (result.id_user !== req.token.id) {
                return res.json({ status: "error", message: "Action not allowed" });
            }

            result.order_supplier = JSON.parse(result?.order_supplier || `[]`)

            res.json({ status: "OK", message: result });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// редактирование Employee
router.post("/:id/edit", async (req, res) => {
    const { f_name, s_name, mobile, add_order_supplier } = req.body;

    if (!f_name?.length < 3 || s_name?.length < 3 || mobile?.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    const options = { ...req.body, updated_at: String(Date.now()) }

    options.order_supplier = JSON.stringify(add_order_supplier);
    delete options.add_order_supplier;

    // отправка запроса
    prisma.employees.update({ data: options, where: { id: Number(req.params.id) } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление Employee
router.post("/:id/remove", itemsController.delete);

module.exports = router;

