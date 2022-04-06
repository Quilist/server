const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const utils = require("../utils");

// получение всех bank_details пользователя
router.get("/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("banks_details"), [req.token.id]));

// добавление bank_details
router.post("/add", utils.isTokenValid, async (req, res) => {
    const { bank_name, mfo, checking_account } = req.body;

    const options = [
        req.token.id,
        bank_name,
        mfo,
        checking_account
    ];

    utils.dbRequest(res, [query.addBankDetail, options], "Succes");
});

// получение bank_details по айди
router.get("/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem("banks_details"), [req.params.id]));

// редактирование bank_details
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    const { bank_name, MFO, checking_account } = req.body;

    const options = [
        bank_name,
        MFO,
        checking_account,
        req.params.id
    ];

    utils.dbRequest(res, [query.editBankDetail, options], "Succes");
});

// Удаление bank_details
router.post("/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem("banks_details"), [req.params.id]], "Succes"));

module.exports = router;