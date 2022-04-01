const express = require("express");
const router = express.Router();

const query = require("../../dbRequests");
const db = require("../../database");
const utils = require("../utils");

// получение всех payments пользователя
router.get("/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("pay"), [req.token.id]));

// добавление pay и pay_type
router.post("/add", utils.isTokenValid, async (req, res) => {
    const { id_type, type, type_order, id_cash_accounts, note, id_legal_entites, payments, changes, totals } = req.body

    if (!totals) return res.json({ status: "error", message: "invalid parameters" });

    // получение payments 
    db.query(`${query.getItems("pay")} AND id_type = ?`, [req.token.id, id_type], (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });
        // вот так просто формируется number :)
        const number = result.length + 1;

        const payOptions = [
            req.token.id,
            number,
            Date.now(),
            id_type,
            type,
            type_order,
            id_cash_accounts,
            note,
            id_legal_entites
        ];
        // добавление pay
        db.query(query.addPay, payOptions, (err, result) => {
            if (err) return res.json({ status: "error", message: err.message });

            const arr = [...payments, ...changes, ...totals];
            const values = [];
            // создание всех значений для pay_type
            arr.forEach(elem => {
                const options = [
                    result.insertId,
                    elem.currency_id,
                    elem.amount,
                    elem.type_pay,
                    elem.type_amount,
                    Date.now()
                ];

                values.push(options);
            });
            // добавление значений в pay_type
            utils.dbRequest(res, query.addPayType, [values], "Succes");
        });
    });
});

// получение pay и pay_type по айди 
router.get("/:id", utils.isTokenValid, async (req, res) => {
    db.query(query.getItem("pay"), [req.params.id], (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });
        // проверка на пренадлежность к пользователю
        if (result[0]?.id_user !== req.token.id) return res.json({ status: "error", message: "Action not allowed" });

        db.query(query.getPayType, [req.params.id], (err, payTypeResult) => {
            if (err) return res.json({ status: "error", message: err.message });

            const array = [[], [], []];
            // разбиваем pay_type результат на 3 массива
            for (let i = 0; i < payTypeResult.length; i++) {
                switch (payTypeResult[i].type_pay) {
                    case "payment":
                        array[0].push(payTypeResult[i]);
                        break;
                    case "change":
                        array[1].push(payTypeResult[i]);
                        break;
                    case "total":
                        array[2].push(payTypeResult[i]);
                        break;
                }
            }

            res.json({
                status: "OK", message: {
                    pay: {
                        ...result[0] || [],
                        payments: array[0],
                        changes: array[1],
                        totals: array[2]
                    },
                }
            });
        });
    });
});

// редактирование pay и pay_type
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    const { id_type, type, type_order, id_cash_accounts, note, id_legal_entites, payments, changes, totals } = req.body

    if (!totals) return res.json({ status: "error", message: "invalid parameters" });

    const options = [
        Date.now(),
        id_type,
        type,
        type_order,
        id_cash_accounts,
        note,
        id_legal_entites,
        req.params.id
    ]
    // редактирование pay
    db.query(query.editPay, options, (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });

        const arr = [...payments, ...changes, ...totals];
        const values = [];
        // создание всех значений для pay_type
        for (let i = 0; i < arr.length; i++) {
            const elem = arr[i];

            if (!elem.id) {
                const payOptions = [
                    result.insertId,
                    elem.currency_id,
                    elem.amount,
                    elem.type_pay,
                    elem.type_amount,
                    Date.now()
                ];

                values.push(payOptions);
            }

            if (elem.id) {
                const updateOptions = [
                    elem.currency_id,
                    elem.amount,
                    elem.type_pay,
                    elem.type_amount,
                    elem.date_create,
                    req.query.id
                ];

                db.query(query.editPayType, updateOptions, err => {
                    if (err) return res.json({ status: "error", message: err.message });
                });
            }
        }

        db.query(query.addPayType, [values], err => {
            if (err) return res.json({ status: "error", message: err.message });

            db.query(query.getIdPayType, [req.query.id], (err, payTypeResult) => {

                for (let i = 0; i < payTypeResult.length; i++) {

                    if (arr.indexOf(payTypeResult[i].id) === -1) {
                        db.query(query.removeItem("pay_type"), [req.query.id], err => {
                            if (err) return res.json({ status: "error", message: err.message });
                        });
                    }
                }
            });

            res.json({ status: "OK", message: "Succes" });
        });
    });
});

// удаление pay и pay_type
router.post("/:id/remove", utils.isTokenValid, async (req, res) => {
    db.query(query.removeItem("pay"), [req.params.id], (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });

        db.query(query.removePayType, [req.params.id], (err, result) => {
            if (err) return res.json({ status: "error", message: err.message });

            res.json({ status: "OK", message: "Succes" });
        });
    });
});

module.exports = router;

