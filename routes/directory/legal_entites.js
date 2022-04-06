const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const utils = require("../utils");

// получение всех LegalEntites юрлиц
router.get("/", utils.isTokenValid, (req, res) => utils.paginations(req, res, query.getItems("legal_entites"), [req.token.id]));

// добавление LegalEntites
router.post("/add", utils.isTokenValid, async (req, res) => {
    const { address, account, site, mail, mobile, name, edrpou, legal_name, inn, low_system, nds, director } = req.body;

    if (name.length < 3 || mobile.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    const options = [
        req.token.id,
        name,
        address,
        mobile,
        account,
        mail,
        site,
        inn,
        legal_name,
        edrpou,
        low_system,
        nds,
        director
    ]

    // отправка запроса
    utils.dbRequest(res, [query.addLegalEntites, options], "Succes");
});

// получение LegalEntites по айди
router.get("/:id", utils.isTokenValid, (req, res) => utils.dbRequestFromId(res, req, query.getItem("legal_entites"), [req.params.id]));

// редактирование LegalEntites
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    const { address, account, site, mail, mobile, name, edrpou, legal_name, inn, low_system, nds, director } = req.body;

    if (name.length < 3 || mobile.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    const options = [
        name,
        address,
        mobile,
        account,
        mail,
        site,
        inn,
        legal_name,
        edrpou,
        low_system,
        nds,
        director,
        req.params.id
    ]

    // отправка запроса
    utils.dbRequest(res, [query.editLegalEntites, options], "Succes");
});

// Удаление LegalEntites
router.post("/:id/remove", utils.isTokenValid, (req, res) => utils.dbRequest(res, [query.removeItem("legal_entites"), [req.params.id]], "Succes"));

module.exports = router;