const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const itemsControllers = require("../../controllers/items/items-controller")

// получение всех клиентов пользователя
router.get("/", (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    prisma.clients.findMany({ skip: limit * (page - 1), take: limit, where: { id_user: req.token.id } })
        .then(async (result) => {

            for (const index in result) {
                result[index].mobile = JSON.parse(result[index]?.mobile)
                result[index].mail = JSON.parse(result[index]?.mail)
            }

            const total = await prisma.clients.count();

            res.json({
                status: "OK", message: {
                    items: result,
                    paginations: {
                        total: total,
                        last_page: total <= limit ? 1 : total / limit
                    }
                }
            });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// добавление клиента
router.post("/add", (req, res) => {
    const { name, mobile, mail } = req.body;

    if (name.length < 3) return res.json({ status: "error", message: "incorrect name" });

    for (let i = 0; i < mobile.length; i++) {
        if (mobile[i].length !== 10 && mobile[i].length !== 0) {
            return res.json({ status: "error", message: "incorrect phone" });
        }
    }

    req.body.mobile = JSON.stringify(mobile);
    req.body.mail = JSON.stringify(mail);

    const dateMs = String(Date.now());

    const options = {
        ...req.body,
        created_at: dateMs,
        updated_at: dateMs
    }

    // отправка запроса
    prisma.clients.create({ data: { id_user: req.token.id, ...options } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение клиента по айди
router.get("/:id", (req, res) => {
    // отправка запроса
    prisma.clients.findUnique({ where: { id: Number(req.params.id) } })
        .then((result) => {
            if (!result) return res.json({ status: "error", message: "Unknow id" });

            // проверка на пренадлежность клиента к пользователю
            if (result.id_user !== req.token.id) {
                return res.json({ status: "error", message: "Action not allowed" });
            }

            result.mobile = JSON.parse(result.mobile);
            result.mail = JSON.parse(result.mail);

            res.json({ status: "OK", message: result });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// редактирование клиента
router.post("/:id/edit", (req, res) => {
    const { name, mobile, mail } = req.body;

    if (name.length < 3) return res.json({ status: "error", message: "incorrect name" });

    for (let i = 0; i < mobile.length; i++) {
        if (mobile[i].length !== 10 && mobile[i].length !== 0) {
            return res.json({ status: "error", message: "incorrect phone" });
        }
    }

    req.body.mobile = JSON.stringify(mobile);
    req.body.mail = JSON.stringify(mail);

    const dateMs = String(Date.now());

    const options = {
        ...req.body,
        updated_at: dateMs
    }

    // отправка запроса
    prisma.clients.update({ data: { ...options }, where: { id: Number(req.params.id) } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление клиента
router.post("/:id/remove", itemsControllers.delete);

module.exports = router;
