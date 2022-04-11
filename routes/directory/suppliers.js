const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const utils = require("../../controllers/utils");
const itemsController = require("../../controllers/items/items-controller");

// получение всех suppliers пользователя
router.get("/", utils.isTokenValid, itemsController.all);

// добавление supplier
router.post("/add", utils.isTokenValid, async (req, res) => {
    let { name, mobile, company, edrpou, nds, code_nds } = req.body;

    if (name?.length < 3 || mobile?.length !== 10) {
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

    // отправка запроса
    prisma.suppliers.create({ data: { id_user: req.token.id, name, mobile, company, edrpou, nds, code_nds } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение supplier по айди
router.get("/:id", utils.isTokenValid, itemsController.id);

// редактирование supplier
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    let { name, mobile, company, edrpou, nds, code_nds } = req.body;

    if (name?.length < 3 || mobile?.length !== 10) {
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

    // отправка запроса
    prisma.suppliers.update({ data: req.token.id, name, mobile, company, edrpou, nds, code_nds, where: { id: req.params.id } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление supplier
router.post("/:id/remove", utils.isTokenValid, itemsController.delete);

module.exports = router;
