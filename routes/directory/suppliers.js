const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const utils = require("../utils");
const youscore = require("../../services/youscore");

// получение всех suppliers пользователя
router.get("/", utils.isTokenValid, (req, res) => utils.paginations(req, res, query.getItems("suppliers"), [req.token.id]));

// добавление supplier
router.post("/add", utils.isTokenValid, async (req, res) => {
    let { name, mobile, mail, company, edrpou, address, notes, nds, code_nds } = req.body;

    if (name.length < 3 || mobile.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    if (edrpou) {
        const vat = await youscore.vat(edrpou);
        const info = await youscore.companyInfo(edrpou);

        if (vat !== undefined && vat?.code !== "InvalidParameters") {
            nds = true;
            code_nds = vat.code;
            company = info.shortName;
        } else {
            return res.json({ status: "error", message: "invalid ? edrpou" })
        }
    }

    const options = [
        req.token.id,
        name,
        mobile,
        company,
        mail,
        edrpou,
        address,
        notes,
        nds,
        code_nds
    ]

    // отправка запроса
    utils.dbRequest(res, [query.AddSupplier, options], "Succes");
});

// получение supplier по айди
router.get("/:id", utils.isTokenValid, (req, res) => utils.dbRequestFromId(res, req, query.getItem("suppliers"), [req.params.id]));

// редактирование supplier
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    let { name, mobile, mail, company, edrpou, address, notes, nds, code_nds } = req.body;

    if (name.length < 3 || mobile.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    if (edrpou) {
        const vat = await youscore.vat(edrpou);
        const info = await youscore.companyInfo(edrpou);

        if (vat !== undefined && vat?.code !== "InvalidParameters") {
            nds = true;
            code_nds = vat.code;
            company = info.shortName;
        } else {
            return res.json({ status: "error", message: "invalid ? edrpou" })
        }
    }

    const options = [
        name,
        mobile,
        company,
        mail,
        edrpou,
        address,
        notes,
        nds,
        code_nds,
        req.params.id
    ]

    // отправка запроса
    utils.dbRequest(res, [query.UpdateSupplier, options], "Succes");
});

// Удаление supplier
router.post("/:id/remove", utils.isTokenValid, (req, res) => utils.dbRequest(res, [query.removeItem("suppliers"), [req.params.id]], "Succes"));

module.exports = router;
