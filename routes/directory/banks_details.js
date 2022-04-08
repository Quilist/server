const express = require("express");
const router = express.Router();

const models = require("../../db/models");
const utils = require("../utils");

// получение всех bank_details пользователя
router.get("/", utils.isTokenValid, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    // отправка запроса
    models.BanksDetails.findAll({ offset: page - 1, limit: limit, where: { id_user: req.token.id } })
        .then(result => {
            const subarray = result.map(elem => elem.dataValues);

            const total = await models.BanksDetails.count();

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

// добавление bank_details
router.post("/add", utils.isTokenValid, async (req, res) => {
    // отправка запроса
    models.BanksDetails.create({ id_user: req.token.id, ...req.body })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение bank_details по айди
router.get("/:id", utils.isTokenValid, async (req, res) => {
    // отправка запроса
    models.BanksDetails.findOne({ where: { id: req.params.id } })
        .then((result) => {
            if (!result) return res.json({ status: "error", message: "Unknow id" });

            const elem = result.dataValues;
            // проверка на пренадлежность клиента к пользователю
            if (elem.id_user !== req.token.id) {
                return res.json({ status: "error", message: "Action not allowed" });
            }

            res.json({ status: "OK", message: elem });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// редактирование bank_details
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    // отправка запроса
    models.BanksDetails.update({ ...req.body }, { where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление bank_details
router.post("/:id/remove", utils.isTokenValid, async (req, res) => {
    // отправка запроса
    models.BanksDetails.destroy({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

module.exports = router;