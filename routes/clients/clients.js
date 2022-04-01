const express = require("express");
const router = express.Router();

const query = require("../../dbRequests");
const db = require("../../database");
const utils = require("../utils");

// получение всех клиентов пользователя
router.get("/", utils.isTokenValid, (req, res) => {
    db.query(query.getItems("clients"), [req.token.id], (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });

        const array = [...result];
        const limit = Number(req.query.limit) || 25;
        const size = array.length < limit ? array.length : array.length / limit;

        const subarray = [];

        for (const index in result) {
            result[index].mobile = result[index]?.mobile.split(";")
            result[index].mail = result[index]?.mail.split(";")
        }

        for (let i = 0; i < Math.ceil(array.length / size); i++) {
            subarray.push(array.slice((i * size), (i * size) + size));
        }

        res.json({
            status: "OK", message: {
                items: subarray[Number(req.query.page) - 1],
                paginations: {
                    total: result.length,
                    last_page: subarray.length
                }
            }
        });
    });
});

// добавление клиента
router.post("/add", utils.isTokenValid, (req, res) => {
    const { name, mobile, company, mail, address, notes } = req.body;

    if (name.length < 3) return res.json({ status: "error", message: "incorrect name" })

    let mobiles = "";
    for (const index in mobile) {
        if (mobile[index].length !== 10 && mobile[index].length !== 0) {
            return res.json({ status: "error", message: "incorrect phone" });
        }

        mobiles += mobile[index] + ";"
    }

    let mails = "";
    for (const index in mail) mails += mail[index] + ";"

    const options = [
        req.token.id,
        name,
        mobiles,
        company,
        mails,
        undefined,
        address,
        notes
    ]

    // отправка запроса
    utils.dbRequest(res, query.AddClient, options, "Succes");
});

// получение клиента по айди
router.get("/:id", utils.isTokenValid, (req, res) => {
    // отправка запроса
    db.query(query.getItem("clients"), [req.params.id], (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });

        // проверка на пренадлежность клиента к пользователю
        if (result[0]?.id_user === req.token.id) {

            result[0].mobile = result[0]?.mobile.split(";")
            result[0].mail = result[0]?.mail.split(";")

            res.json({ status: "OK", message: result[0] });
        } else {
            res.json({ status: "error", message: "Action not allowed" })
        }
    });
});

// редактирование клиента
router.post("/:id/edit", utils.isTokenValid, (req, res) => {
    const { name, mobile, company, mail, address, notes } = req.body;

    if (name.length < 3) return res.json({ status: "error", message: "incorrect name" })

    let mobiles = "";
    for (const index in mobile) {
        if (mobile[index].length !== 10 && mobile[index].length !== 0) {
            return res.json({ status: "error", message: "incorrect phone" })
        }

        mobiles += mobile[index] + ";"
    }

    let mails = "";
    for (const index in mail) mails += mail[index] + ";";

    const options = [
        name,
        mobiles,
        company,
        mails,
        address,
        notes,
        req.params.id
    ]
    // отправка запроса
    utils.dbRequest(res, query.UpdateClient, options, "Succes");
});

// Удаление клиента
router.post("/:id/remove", utils.isTokenValid, (req, res) => utils.dbRequest(res, query.removeItem("clients"), [req.params.id], "Succes"));

module.exports = router;
