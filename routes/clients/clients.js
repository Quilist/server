const express = require("express");
const router = express.Router();

const models = require("../../db/models");
const utils = require("../utils");

// получение всех клиентов пользователя
router.get("/", utils.isTokenValid, (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    models.Clients.findAll({ offset: page - 1, limit: limit, where: { id_user: req.token.id } })
        .then(result => {
            const subarray = result.map(elem => elem.dataValues);

            for (const index in result) {
                result[index].mobile = result[index]?.mobile.split(";")
                result[index].mail = result[index]?.mail.split(";")
            }

            const total = await models.Clients.count();
            
            res.json({
                status: "OK", message: {
                    items: subarray,
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
router.post("/add", utils.isTokenValid, (req, res) => {
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
    for (const index in mail) mails += mail[index] + ";"

    // отправка запроса
    models.Clients.create({ id_user: req.token.id, ...req.body })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение клиента по айди
router.get("/:id", utils.isTokenValid, (req, res) => {
    // отправка запроса
    models.Clients.findOne({ where: { id: req.params.id } })
        .then((result) => {
            if (!result) return res.json({ status: "error", message: "Unknow id" });

            let elem = result.dataValues;
            // проверка на пренадлежность клиента к пользователю
            if (elem.id_user !== req.token.id) {
                return res.json({ status: "error", message: "Action not allowed" });
            }

            elem.mobile = result[0]?.mobile.split(";")
            elem.mail = result[0]?.mail.split(";")

            res.json({ status: "OK", message: elem });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// редактирование клиента
router.post("/:id/edit", utils.isTokenValid, (req, res) => {
    const { name, mobile, company, mail, address, notes } = req.body;

    if (name.length < 3) return res.json({ status: "error", message: "incorrect name" })

    let mobiles = "";
    for (const index in mobile) {
        if (mobile[index].length !== 10) {
            return res.json({ status: "error", message: "incorrect phone" })
        }
        mobiles += mobile[index] + ";"
    }

    let mails = "";
    for (const index in mail) mails += mail[index] + ";";

    // отправка запроса
    models.Clients.update({ ...req.body }, { where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление клиента
router.post("/:id/remove", utils.isTokenValid, (req, res) => {
    models.Clients.destroy({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

module.exports = router;
