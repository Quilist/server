const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const db = require("../../db/database");
const utils = require("../utils");

// получение всех Employees пользователя
router.get("/", utils.isTokenValid, (req, res) => utils.paginations(req, res, query.getItems("employees"), [req.token.id]));

// добавление Employee
router.post("/add", utils.isTokenValid, async (req, res) => {
    const { f_name, s_name, mobile, password, mail, id_role, id_cach_acc, dachboard, suppliers, cash_accounts, add_order_supplier } = req.body;

    if (!f_name || f_name.length < 3 || !s_name || s_name.length < 3 || !mobile || mobile.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    const options = [
        req.token.id,
        f_name,
        s_name,
        mobile,
        password,
        mail,
        id_role,
        id_cach_acc,
        dachboard,
        suppliers,
        cash_accounts,
        JSON.stringify(add_order_supplier)
    ]
    // отправка запроса
    utils.dbRequest(res, [query.AddEmployee, options], "Succes");
});

// получение Employee по айди
router.get("/:id", utils.isTokenValid, (req, res) => {
    if (req.params.id === "Add") return res.json({ status: "error", message: [] })
    // отправка запроса
    db.query(query.getItem("employees"), [req.params.id], (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });

        result[0].order_supplier = JSON.parse(result[0]?.order_supplier || `[]`)

        // проверка на пренадлежность Employee к пользователю
        if (result[0]?.id_user === req.token.id) {

            res.json({ status: "OK", message: result.length != 0 ? result[0] : [] });
        } else {
            res.json({ status: "error", message: "Action not allowed" })
        }
    });
});

// редактирование Employee
router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
    const { f_name, s_name, mobile, password, mail, id_role, id_cach_acc, dachboard, suppliers, cash_accounts, add_order_supplier } = req.body;

    if (!f_name || f_name.length < 3 || !s_name || s_name.length < 3 || !mobile || mobile.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    const options = [
        f_name,
        s_name,
        mobile,
        password,
        mail,
        id_role,
        id_cach_acc,
        dachboard,
        suppliers,
        cash_accounts,
        JSON.stringify(add_order_supplier),
        req.params.id
    ]
    // отправка запроса
    utils.dbRequest(res, [query.UpdateEmployee, options], "Succes");
});

// Удаление Employee
router.post("/:id/remove", utils.isTokenValid, (req, res) => utils.dbRequest(res, [query.removeItem("employees"), [req.params.id]], "Succes"));

module.exports = router;

