const express = require("express");
const prisma = require("../../database/database");
const router = express.Router();

// const prisma = require("../../database/database");
// const utils = require("../../controllers/utils");
// const itemsController = require("../../controllers/items/items-controller");

//router.get("/", async (req, res) => res.json({ status: "OK", message: [] }));

// // получение всех money пользователя
router.get("/", (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

  prisma.pay.findMany({ skip: limit * (page - 1), take: limit })
    .then(async (result) => {
      const total = await prisma.pay.count();

      res.json({
        status: "OK", message: {
          items: result,
          paginations: {
            total: total,
            last_page: total <= limit ? 1 : total / limit
          }
        }
      });
    })
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.post("/add", async(req, res) => {
  const dateMs = String(Date.now());

  // const amountData = req.body.amount_data;
  // delete req.body.amount_data;
  // console.log('amountData', amountData)

  const data = {
    ...req.body,
    id_user: req.token.id,
    number: 1,
    updated_at: dateMs
  }

  try {
    const pay = await prisma.pay.create({ data: data })
    //const [result] = await prisma.$queryRaw`SELECT LAST_INSERT_ID() AS id`
    console.log(pay)
    // if(amountData && amountData.length > 0) {
    //   let subData = {};
    //   amountData.forEach(function (item) {
    //     subData = {
    //       ...item,
    //       product_id: result.id,
    //       created_at: dateMs,
    //       updated_at: dateMs
    //     }
    //     prisma.productAmountData.create({ data: subData })
    //   });
    //   //amountData.map(obj => ({ ...obj, product_id: result.id }))
    //   // await prisma.productAmountData.createMany({
    //   //   data: amountData
    //   // })
    // }

    res.json({ status: "OK",
      message: "Success"})
  } catch (e) {
    console.log(e)
    throw e
  }
});

router.get("/:id", (req, res) => {

  prisma.pay.findUnique({ where: { id: Number(req.params.id) } })
    .then((result) => {
      if (!result) return res.json({ status: "error", message: "Unknown id" });

      if (result.id_user !== req.token.id) {
        return res.json({ status: "error", message: "Action not allowed" });
      }

      res.json({ status: "OK", message: result });
    })
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.post("/:id/remove", (req, res) => {
  prisma.pay.delete({ where: { id: Number(req.params.id) } })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.get("/auxiliary/data", async (req, res) => {

  const type = req.query.type
  const types = {
    pay_supplier: "supplier",
    pay_customer: "client",
    pay_expend: "expenditure",

    receive_income: "incomeItem",
    receive_customer: "client",
    receive_supplier: "supplier"
  }

  const supplier = await prisma[types[type]].findMany();
  const cashAccount = await prisma.cashAccount.findMany();

  const legalEntity = await prisma.legalEntity.findMany();
  const currency = await prisma.currency.findMany();

  const data = {
    cash_accounts: cashAccount,
    legal_entites: legalEntity,
    currencies: currency,
    items: supplier
  };

  Promise.all([data])
    .then(elem => {
      res.json({
        status: "OK", message: data
      });
    })
    .catch(({ message }) => res.json({ status: "error", message }));

});

// router.get("/", utils.isTokenValid, async (req, res) => {
//   const date_from = req.query.date_from || 0;
//   const date_to = req.query.date_to || Date.now();

//   const page = Number(req.query.page) || 1;
//   const limit = Number(req.query.limit) || 25;

//   const promises = ["pay", "currency_exchange", "moving_money"].map(elem => {
//     return utils.makeQuery(`${query.getItems(elem)} AND date_create > ? AND date_create < ?`, [req.token.id, date_from, date_to]);
//   });

//   Promise.all(promises)
//     .then(elem => {
//       const array = [...elem[0], ...elem[1], ...elem[2]];
//       const size = array.length < limit ? array.length : limit;

//       const subarray = [];

//       if (array.length !== 0) {
//         array.sort((a, b) => Number(b.date_create) - Number(a.date_create));

//         for (let i = 0; i < Math.ceil(array.length / size); i++) {
//           subarray.push(array.slice((i * size), (i * size) + size));
//         }
//       }

//       res.json({
//         status: "OK", message: {
//           items: subarray.length !== 0 ? subarray[page - 1] : [],
//           paginations: {
//             total: array.length,
//             last_page: subarray.length
//           }
//         }
//       });
//     })
//     .catch(({ message }) => res.json({ status: "error", message }));
// });

// // Получение all_currencies, cash_accounts, legal_entites
// router.get("/auxiliary", utils.isTokenValid, async (req, res) => {

//   const type = req.query.type

//   if (!type) return res.json({ status: "error", message: "Invalid type" });

//   const items = {
//     pay_supplier: "suppliers",
//     pay_customer: "clients",
//     pay_expend: "expenditure",

//     receive_income: "income_items",
//     receive_customer: "clients",
//     receive_supplier: "suppliers"
//   }

//   const user = { pay_owner: "user", receive_owner: "user" }

//   const promises = ["cash_and_accounts", "legal_entites"].map(async (elem) => {
//     return utils.makeQuery(query.getItems(elem), req.token.id);
//   })

//   const types = () => {
//     if (type in items) {
//       return utils.makeQuery(query.getItems(items[type]), req.token.id);
//     }

//     if (type === "pay_salary") {
//       return utils.makeQuery(query.getItems("employees", "id_user, f_name, s_name, mobile, password, mail, id_role, id_cach_acc, dachboard, suppliers, cash_accounts, order_supplier"), req.token.id);
//     }

//     if (type in user) {
//       return utils.makeQuery(query.getItem(user[type], "username"), req.token.id);
//     }
//   }

//   const currencies = utils.makeQuery(query.getAllCurrencies);

//   Promise.all([...promises, currencies, types()])
//     .then(elem => {
//       res.json({
//         status: "OK", message: {
//           cash_account: elem[0],
//           legal_entites: elem[1],
//           currencies: elem[2],
//           items: elem[3]
//         }
//       });
//     })
//     .catch(({ message }) => res.json({ status: "error", message }));
// });

// // добавление currency_exchange и moving_money
// router.post("/:db/add", utils.isTokenValid, async (req, res) => {
//   const { created_at, from_currency_id, to_currency_id, exchange_rate, cash_account_id, amount_pay, amount_receive, note, from_cash_account_id, to_cash_account_id, amount } = req.body;

//   if (req.params.db === "currency_exchange") {
//     const options = [
//       req.token.id,
//       created_at,
//       from_currency_id,
//       to_currency_id,
//       exchange_rate,
//       cash_account_id,
//       amount_pay,
//       amount_receive,
//       note
//     ];

//     utils.dbRequest(res, [query.addCurrencyExchange, options], "Succes");
//   }

//   if (req.params.db === "moving_money") {
//     const options = [
//       req.token.id,
//       created_at,
//       from_cash_account_id,
//       to_cash_account_id,
//       amount,
//       note
//     ];

//     utils.dbRequest(res, [query.addMovingMoney, options], "Succes");
//   }
// });

// // получение money по айди
// router.get("/:db/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem(req.params.db), [req.params.id]));

// // редактирование money
// router.post("/:db/:id/edit", utils.isTokenValid, async (req, res) => {
//   const { created_at, from_currency_id, to_currency_id, exchange_rate, cash_account_id, amount_pay, amount_receive, note, from_cash_account_id, to_cash_account_id, amount, } = req.body;

//   if (req.params.db === "currency_exchange") {
//     const options = [
//       created_at,
//       from_currency_id,
//       to_currency_id,
//       exchange_rate,
//       cash_account_id,
//       amount_pay,
//       amount_receive,
//       note,
//       req.params.id
//     ];

//     utils.dbRequest(res, [query.editCurrencyExchange, options], "Succes");
//   }

//   if (req.params.db === "moving_money") {
//     const options = [
//       created_at,
//       from_cash_account_id,
//       to_cash_account_id,
//       amount,
//       note,
//       req.params.id
//     ];

//     utils.dbRequest(res, [query.editMovingMoney, options], "Succes");
//   }
// });

// // Удаление money
// router.post("/:db/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem(req.params.db), [req.params.id]], "Succes"));

module.exports = router;