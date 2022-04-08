const express = require("express");
const router = express.Router();

const models = require("../../db/models");
const utils = require("../utils");

// получение всех currencies пользователя
router.get("/", utils.isTokenValid, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    // отправка запроса
    models.UserCurrencies.findAll({ offset: page - 1, limit: limit, where: { id_user: req.token.id } })
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

// получение all_currencies
router.get("/auxiliary", utils.isTokenValid, async (req, res) => {
    models.AllCurrencies.findAll({})
        .then(result => {
            const array = result.map(elem => elem.dataValues);

            res.json({ status: "OK", message: array });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// добавление currencies
router.post("/add", utils.isTokenValid, async (req, res) => {
    const { id_from_currencies, id_to_currencies } = req.body;

    if (id_from_currencies === id_to_currencies) {
        return res.json({ status: "error", message: "Value one cannot be equal to value two" });
    }

    models.UserCurrencies.findAll({ where: { id_user: req.token.id } })
        .then(result => {
            // проверка на то, есть ли валютная пара с таким курсом
            const index = result.findIndex(el => {
                if (el.dataValues.id_from_currencies === id_from_currencies &&
                    l.dataValues.id_to_currencies === id_to_currencies) return true;
            });

            if (index !== -1) return res.json({ status: "error", message: "Currency pair already in use" });

            models.UserCurrencies.create({ id_user: req.token.id, ...req.body })
                .then(() => res.json({ status: "OK", message: "Succes" }))
                .catch(err => res.json({ status: "error", message: err.message }));
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение currencies по айди
router.get("/:id", utils.isTokenValid, async (req, res) => {
    // отправка запроса
    models.UserCurrencies.findOne({ where: { id: req.params.id } })
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

// редактирование currencies
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    models.UserCurrencies.update({ ...req.body }, { where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление currencies
router.post("/:id/remove", utils.isTokenValid, (req, res) => {
    models.UserCurrencies.destroy({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

module.exports = router;


