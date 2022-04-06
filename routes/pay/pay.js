const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const db = require("../../db/database");
const utils = require("../utils");

// получение всех payments пользователя
router.get("/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("pay"), [req.token.id]));

// добавление pay и pay_type
router.post("/add", utils.isTokenValid, async (req, res) => {
    const { id_type, type, type_order, id_cash_accounts, note, id_legal_entites, payments } = req.body

    const changes = req.body.changes || [];
    const totals = req.body.totals || [];

    const arr = [...payments, ...changes, ...totals];

    // получение payments 
    const promise = new Promise((resolve, reject) => {
        db.query(`${query.getItems("pay")} AND id_type = ?`, [req.token.id, id_type], (err, result) => {
            if (err) return res.json({ status: "error", message: err.message });
            resolve(result);
        });
    });
    // вот так просто формируется number :)
    const number = (await promise).length + 1;

    const options = [
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
    db.query(query.addPay, options, (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });
        // создание всех значений для pay_type
        const values = arr.map(elem => {
            const { currency_id, amount, type_pay, type_amount } = elem;

            if (!currency_id || !amount || !type_pay || !type_amount) return res.json({ status: "error", message: "Unknow values" });

            const options = [
                result.insertId,
                currency_id,
                amount,
                type_pay,
                type_amount,
                Date.now()
            ];

            return options;
        });
        // добавление значений в pay_type
        utils.dbRequest(res, [query.addPayType, [values]], "Succes");
    });
});

// получение pay и pay_type по айди 
router.get("/:id", utils.isTokenValid, async (req, res) => {
    // получение pay
    const promise = new Promise((resolve) => {
        db.query(query.getItem("pay"), [req.params.id], (err, result) => {
            if (err) return res.json({ status: "error", message: err.message });
            // проверка на пренадлежность к пользователю
            if (result[0]?.id_user !== req.token.id) return res.json({ status: "error", message: "Action not allowed" });

            resolve(result);
        });
    });

    const result = await promise;
    // получение pay_type
    db.query(query.getPayType, [req.params.id], (err, payTypeResult) => {
        if (err) return res.json({ status: "error", message: err.message });

        const array = [[], [], []];
        // разбиваем pay_type результат на 3 массива
        for (let i = 0; i < payTypeResult.length; i++) {
            switch (payTypeResult[i].type_pay) {
                case "payment": {
                    array[0].push(payTypeResult[i]);
                    break;
                }
                case "change": {
                    array[1].push(payTypeResult[i]);
                    break;
                }
                case "total": {
                    array[2].push(payTypeResult[i]);
                    break;
                }
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

// редактирование pay и pay_type
router.post("/:id/edit", utils.isTokenValid, (req, res) => {
    const { id_type, type, type_order, id_cash_accounts, note, id_legal_entites, payments } = req.body;

    const changes = req.body.changes || [];
    const totals = req.body.totals || [];

    const arr = [...payments, ...changes, ...totals];

    const options = [
        Date.now(),
        id_type,
        type,
        type_order,
        id_cash_accounts,
        note,
        id_legal_entites,
        req.params.id
    ];

    utils.makeQuery(query.editPay, options)
        .then(() => {
            const values = [];
            // редактирование и добавление pay_type
            for (let i = 0; i < arr.length; i++) {
                const { id, currency_id, amount, type_pay, type_amount, date_create } = arr[i];

                if (!currency_id || !amount || !type_pay || !type_amount) return res.json({ status: "error", message: "Unknow values" });

                // если айди нет, то записываем в value
                if (!id) {
                    const options = [
                        req.params.id,
                        currency_id,
                        amount,
                        type_pay,
                        type_amount,
                        Date.now()
                    ];

                    values.push(options);
                }
                // если айди есть, то редактируем
                if (id) {
                    const options = [
                        currency_id,
                        amount,
                        type_pay,
                        type_amount,
                        date_create,
                        req.params.id
                    ];

                    utils.makeQuery(query.editPayType, options).catch(({ message }) => res.json({ status: "error", message }));
                }
            }
            return utils.makeQuery(query.addPayType, [values]);
        })
        .then(() => utils.makeQuery(query.getPayType, [req.query.id]))
        .then((payTypeResult) => {
            for (let i = 0; i < payTypeResult.length; i++) {
                const index = arr.findIndex((el) => el.id === payTypeResult[i].id);
                // если айди не найден, то удаляем запись
                if (index === -1) {
                    return utils.makeQuery(query.removeItem("pay_type"), [req.query.id]);
                }
            }
        })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(({ message }) => res.json({ status: "error", message }));
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

