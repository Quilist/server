const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const db = require("../../db/database");
const utils = require("../utils");

// получение всех money пользователя
router.get("/", utils.isTokenValid, async (req, res) => {
  const date_from = req.query.date_from || 0;
  const date_to = req.query.date_to || Date.now();

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

  const promises = ["pay", "currency_exchange", "moving_money"].map(elem => {
    return utils.makeQuery(`${query.getItems(elem)} AND date_create > ? AND date_create < ?`, [req.token.id, date_from, date_to]);
  });

  Promise.all(promises).then(elem => {
    const array = [...elem[0], ...elem[1], ...elem[2]];
    const size = array.length < limit ? array.length : limit;

    const subarray = [];

    if (array.length !== 0) {
      array.sort((a, b) => Number(b.date_create) - Number(a.date_create));

      for (let i = 0; i < Math.ceil(array.length / size); i++) {
        subarray.push(array.slice((i * size), (i * size) + size));
      }
    }

    res.json({
      status: "OK", message: {
        items: subarray.length !== 0 ? subarray[page - 1] : [],
        paginations: {
          total: array.length,
          last_page: subarray.length
        }
      }
    });
  });
});

// Получение all_currencies, cash_accounts, legal_entites
router.get("/auxiliary", utils.isTokenValid, async (req, res) => {

  const type = req.query.type

  if (!type) return res.json({ status: "error", message: "Invalid type" });

  const items = {
    pay_supplier: "suppliers",
    pay_customer: "clients",
    expend: "expenditure",
    type: "salary",

    receive_income: "income_items",
    receive_customer: "clients",
    receive_supplier: "suppliers"
  }

  const user = { pay_owner: "user", receive_owner: "user" }

  const promises = ["cash_accounts", "legal_entites"].map(elem => {
    return utils.makeQuery(query.getItems(elem), req.token.id);
  })

  const types = () => {
    if (type in items) {
      return utils.makeQuery(query.getItems(items[type]), req.token.id);
    }

    if (type === "salary") {
      return utils.makeQuery(query.getItems("employees", "id_user, f_name, s_name, mobile, password, mail, id_role, id_cach_acc, dachboard, suppliers, cash_accounts, order_supplier"), req.token.id);
    }

    if (type in user) {
      return utils.makeQuery(query.getItem(user[type], "username"), req.token.id);
    }
  }

  Promise.all([...promises, utils.makeQuery(query.getAllCurrencies), types()]).then(elem => {
    console.log(elem)
    res.json({
      status: "OK", message: {
        cash_account: elem[0],
        legal_entites: elem[1],
        currencies: elem[2],
        type: elem[3]
      }
    });
  });
});

// добавление currency_exchange и moving_money
router.post("/:db/add", utils.isTokenValid, async (req, res) => {
  const { created_at, from_currency_id, to_currency_id, exchange_rate, cash_account_id, amount_pay, amount_receive, note, from_cash_account_id, to_cash_account_id, amount } = req.body;

  if (req.params.db === "currency_exchange") {
    const options = [
      req.token.id,
      created_at,
      from_currency_id,
      to_currency_id,
      exchange_rate,
      cash_account_id,
      amount_pay,
      amount_receive,
      note
    ];

    utils.dbRequest(res, [query.addCurrencyExchange, options], "Succes");
  }

  if (req.params.db === "moving_money") {
    const options = [
      req.token.id,
      created_at,
      from_cash_account_id,
      to_cash_account_id,
      amount,
      note
    ];

    utils.dbRequest(res, [query.addMovingMoney, options], "Succes");
  }
});

// получение money по айди
router.get("/:db/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem(req.params.db), [req.params.id]));

// редактирование money
router.post("/:db/:id/edit", utils.isTokenValid, async (req, res) => {
  const { created_at, from_currency_id, to_currency_id, exchange_rate, cash_account_id, amount_pay, amount_receive, note, from_cash_account_id, to_cash_account_id, amount, } = req.body;

  if (req.params.db === "currency_exchange") {
    const options = [
      created_at,
      from_currency_id,
      to_currency_id,
      exchange_rate,
      cash_account_id,
      amount_pay,
      amount_receive,
      note,
      req.params.id
    ];

    utils.dbRequest(res, [query.editCurrencyExchange, options], "Succes");
  }

  if (req.params.db === "moving_money") {
    const options = [
      created_at,
      from_cash_account_id,
      to_cash_account_id,
      amount,
      note,
      req.params.id
    ];

    utils.dbRequest(res, [query.editMovingMoney, options], "Succes");
  }
});

// Удаление money
router.post("/:db/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem(req.params.db), [req.params.id]], "Succes"));

module.exports = router;