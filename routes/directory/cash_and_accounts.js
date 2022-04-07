const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const utils = require("../utils");

const monobank = require("../../services/banks/monobank");
const privat24 = require("../../services/banks/privat24");

// получение всех cash_and_accounts пользователя
router.get("/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("cash_and_accounts"), [req.token.id]));

// добавление cash_and_accounts
router.post("/add", utils.isTokenValid, async (req, res) => {
    let { id_type_order, name, id_user_currencies, id_bank_details, balanceIn, turnoverDebt, turnoverCred, type, stream } = req.body;

    const options = [
        req.token.id,
        id_type_order,
        name,
        id_user_currencies,
        id_bank_details,
        balanceIn,
        turnoverDebt,
        turnoverCred,
        type,
        JSON.stringify(stream)
    ];

    utils.dbRequest(res, [query.addCashAccount, options], "Succes");
});

// получение cash_and_accounts по айди
router.get("/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, [req, query.getItem("cash_and_accounts")], [req.params.id]));

// редактирование cash_and_accounts
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    const { id_type_order, name, id_user_currencies, id_bank_details, balanceIn, turnoverDebt, turnoverCred, type, stream } = req.body;

    const options = [
        id_type_order,
        name,
        id_user_currencies,
        id_bank_details,
        balanceIn,
        turnoverDebt,
        turnoverCred,
        type,
        JSON.stringify(stream),
        req.params.id
    ];

    utils.dbRequest(res, [query.editCashAccount, options], "Succes");
});

// Удаление cash_and_accounts
router.post("/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem("cash_and_accounts"), [req.params.id]], "Succes"));

module.exports = router;
