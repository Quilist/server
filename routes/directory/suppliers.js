const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const itemsController = require("../../controllers/items/items-controller");

const youscore = require("../../services/youscore");

// получение всех suppliers пользователя
router.get("/", itemsController.all);

// добавление supplier
router.post("/add", async (req, res) => {
    let { name, mobile, company, edrpou, nds, code_nds, address, notes } = req.body;

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

    const dateMs = String(Date.now());

    const options = {
        id_user: req.token.id,
        name,
        mobile,
        company,
        edrpou,
        nds,
        code_nds,
        mail,
        address,
        note: notes,
        created_at: dateMs,
        updated_at: dateMs
    }

    // отправка запроса
    prisma.suppliers.create({ data: options })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// получение supplier по айди
router.get("/:id", itemsController.id);

// редактирование supplier
router.post("/:id/edit", async (req, res) => {
    let { name, mobile, mail, company, edrpou, nds, code_nds, address, notes } = req.body;

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

    const options = {
        name,
        mobile,
        company,
        edrpou,
        nds,
        code_nds,
        mail,
        address,
        note: notes,
        updated_at: String(Date.now())
    }

    // отправка запроса
    prisma.suppliers.update({ data: options, where: { id: Number(req.params.id) } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление supplier
router.post("/:id/remove", itemsController.delete);

module.exports = router;