const express = require("express");
const router = express.Router();

const query = require("../../dbRequests");
const db = require("../../database");
const utils = require("../utils");

// получение всех money пользователя
router.get("/", utils.isTokenValid, async (req, res) => {
  const date_from = req.query.date_from || 0;
  const date_to = req.query.date_to || Date.now();

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

  const promises = ["pay", "currency_exchange", "moving_money"].map(elem => {
    return new Promise((resolve) => {
      db.query(`${query.getItems(elem)} AND date_create > ? AND date_create < ?`, [req.token.id, date_from, date_to], (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });
        resolve(result);
      });
    });
  })

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

// добавление currency_exchange и moving_money
router.post(`/:db/add`, utils.isTokenValid, async (req, res) => {
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

    utils.dbRequest(res, query.addCurrencyExchange, options, "Succes");
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

    utils.dbRequest(res, query.addMovingMoney, options, "Succes");
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

    utils.dbRequest(res, query.editCurrencyExchange, options, "Succes");
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

    utils.dbRequest(res, query.editMovingMoney, options, "Succes");
  }
});

// Удаление money
router.post("/:db/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, query.removeItem(req.params.db), [req.params.id], "Succes"));

module.exports = router;