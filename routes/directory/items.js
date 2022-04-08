const express = require("express");
const router = express.Router();

const models = require("../../db/models");
const utils = require("../utils");

// ОЧЕНЬ ВРЕМЕННЫЙ ВАРИАНТ

// получение всех type_price пользователя
router.get("/type_price", utils.isTokenValid, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    // отправка запроса
    models.TypePrice.findAll({ offset: page - 1, limit: limit, where: { id_user: req.token.id } })
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

// добавление type_price
router.post("/type_price/add", utils.isTokenValid, async (req, res) => {

    models.TypePrice.create({ id_user: req.token.id, ...req.body })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение type_price по айди
router.get("/type_price/:id", utils.isTokenValid, async (req, res) => {

    models.TypePrice.findOne({ where: { id: req.params.id } })
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

// редактирование type_price
router.post("/type_price/:id/edit", utils.isTokenValid, async (req, res) => {

    models.TypePrice.update({ ...req.body }, { where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление type_price
router.post("/type_price/:id/remove", utils.isTokenValid, async (req, res) => {

    models.TypePrice.destroy({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});


// получение всех storehouse пользователя
router.get("/storehouse/", utils.isTokenValid, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    // отправка запроса
    models.StoreHouse.findAll({ offset: page - 1, limit: limit, where: { id_user: req.token.id } })
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

// добавление storehouse
router.post("/storehouse/add", utils.isTokenValid, async (req, res) => {

    models.StoreHouse.create({ id_user: req.token.id, ...req.body })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение storehouse по айди
router.get("/storehouse/:id", utils.isTokenValid, async (req, res) => {

    models.StoreHouse.findOne({ where: { id: req.params.id } })
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

// редактирование storehouse
router.post("/storehouse/:id/edit", utils.isTokenValid, async (req, res) => {

    models.StoreHouse.update({ ...req.body }, { where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление storehouse
router.post("/storehouse/:id/remove", utils.isTokenValid, async (req, res) => {

    models.StoreHouse.destroy({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});


// получение всех measure пользователя
router.get("/measure/", utils.isTokenValid, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    // отправка запроса
    models.Measure.findAll({ offset: page - 1, limit: limit, where: { id_user: req.token.id } })
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

// добавление measure
router.post("/measure/add", utils.isTokenValid, async (req, res) => {

    models.Measure.create({ id_user: req.token.id, ...req.body })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение measure по айди
router.get("/measure/:id", utils.isTokenValid, async (req, res) => {

    models.Measure.findOne({ where: { id: req.params.id } })
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

// редактирование measure
router.post("/measure/:id/edit", utils.isTokenValid, async (req, res) => {

    models.Measure.update({ ...req.body }, { where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление measure
router.post("/measure/:id/remove", utils.isTokenValid, async (req, res) => {

    models.Measure.destroy({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});


// получение всех expenditure пользователя
router.get("/expenditure/", utils.isTokenValid, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    // отправка запроса
    models.Expenditure.findAll({ offset: page - 1, limit: limit, where: { id_user: req.token.id } })
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

// добавление expenditure
router.post("/expenditure/add", utils.isTokenValid, async (req, res) => {

    models.Expenditure.create({ id_user: req.token.id, ...req.body })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение expenditure по айди
router.get("/expenditure/:id", utils.isTokenValid, async (req, res) => {

    models.Expenditure.findOne({ where: { id: req.params.id } })
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

// редактирование expenditure
router.post("/expenditure/:id/edit", utils.isTokenValid, async (req, res) => {

    models.Expenditure.update({ ...req.body }, { where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление expenditure
router.post("/expenditure/:id/remove", utils.isTokenValid, async (req, res) => {

    models.Expenditure.destroy({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});


// получение всех income_items пользователя
router.get("/income_items/", utils.isTokenValid, async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    // отправка запроса
    models.IncomeItems.findAll({ offset: page - 1, limit: limit, where: { id_user: req.token.id } })
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

// добавление income_items
router.post("/income_items/add", utils.isTokenValid, async (req, res) => {

    models.IncomeItems.create({ id_user: req.token.id, ...req.body })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение income_items по айди
router.get("/income_items/:id", utils.isTokenValid, async (req, res) => {

    models.IncomeItems.findOne({ where: { id: req.params.id } })
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

// редактирование income_items
router.post("/income_items/:id/edit", utils.isTokenValid, async (req, res) => {

    models.IncomeItems.update({ ...req.body }, { where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление income_items
router.post("/income_items/:id/remove", utils.isTokenValid, async (req, res) => {

    models.IncomeItems.destroy({ where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

module.exports = router;