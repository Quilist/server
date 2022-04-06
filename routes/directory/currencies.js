const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const db = require("../../db/database");
const utils = require("../utils");

// получение всех currencies пользователя
router.get("/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("user_currencies"), [req.token.id]));

// получение all_currencies
router.get("/auxiliary", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.getAllCurrencies]));

// добавление currencies
router.post("/add", utils.isTokenValid, async (req, res) => {
    const { id_from_currencies, id_to_currencies, exchange_rate } = req.body;

    const options = [
        req.token.id,
        id_from_currencies,
        id_to_currencies,
        exchange_rate
    ]
    
    if (id_from_currencies === id_to_currencies) return res.json({ status: "error", message: "Value one cannot be equal to value two" });

    // получение всех currencies пользователя
    db.query(query.getCurrencies, [req.token.id], (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });

        // проверка на то, есть ли валютная пара с таким курсом
        const index = result.findIndex(el => {
            if (el.id_from_currencies === id_from_currencies && el.id_to_currencies === id_to_currencies) return true;
        });

        if (index !== -1) return res.json({ status: "error", message: "Currency pair already in use" });

        // отправка запроса
        utils.dbRequest(res, [query.addCurrency, options], "Succes");
    });
});

// получение currencies по айди
router.get("/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem("user_currencies"), [req.params.id]));

// редактирование currencies
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    const { id_from_currencies, id_to_currencies, exchange_rate } = req.body;

    const options = [
        id_from_currencies,
        id_to_currencies,
        exchange_rate,
        req.params.id
    ];

    utils.dbRequest(res, [query.editCurrency, options], "Succes");
});

// Удаление currencies
router.post("/:id/remove", utils.isTokenValid, (req, res) => utils.dbRequest(res, [query.removeItem("user_currencies"), [req.params.id]], "Succes"));

module.exports = router;


