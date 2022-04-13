const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

// получение всех клиентов пользователя
router.get("/", (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    prisma.client.findMany({ skip: limit * (page - 1), take: limit })
        .then(async result => {

            for (const index in result) {
                result[index].mobile = result[index]?.mobile.split(";")
                result[index].mail = result[index]?.mail.split(";")
            }

            const total = await prisma.client.count();

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
    let { name, mobile, mail } = req.body;

    if (name.length < 3) return res.json({ status: "error", message: "incorrect name" });

    for (let i = 0; i < mobile.length; i++) {
        if (mobile[i].length !== 10) {
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

    console.log(req.token)
    // отправка запроса
    prisma.client.create({ data: { id_user: req.token.id, ...options } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение клиента по айди
router.get("/:id", (req, res) => {
    // отправка запроса
    prisma.client.findUnique({ where: { id: req.params.id } })
        .then((result) => {
            if (!result) return res.json({ status: "error", message: "Unknow id" });

            // проверка на пренадлежность клиента к пользователю
            if (result.id_user !== req.token.id) {
                return res.json({ status: "error", message: "Action not allowed" });
            }

            result.mobile = JSON.parse(mobile);
            result.mail = JSON.parse(mobile);

            res.json({ status: "OK", message: result });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// редактирование клиента
router.post("/:id/edit", (req, res) => {
    const { name, mobile, mail } = req.body;

    if (name.length < 3) return res.json({ status: "error", message: "incorrect name" });

    let mobiles = "";
    for (const index in mobile) {
        if (mobile[index].length !== 10) {
            return res.json({ status: "error", message: "incorrect phone" });
        }
        mobiles += mobile[index] + ";"
    }

    let mails = "";
    for (const index in mail) mails += mail[index] + ";";

    // отправка запроса
    prisma.client.update({ data: { ...req.body }, where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление клиента
router.post("/:id/remove", (req, res) => {
    prisma.client.delete({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

module.exports = router;
