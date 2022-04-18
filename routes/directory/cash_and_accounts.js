const express = require("express");
const itemsController = require("../../controllers/items/items-controller");
const prisma = require("../../database/database");
const router = express.Router();

// const prisma = require("../../database/database");
// const utils = require("../../controllers/utils");
// const itemsController = require("../../controllers/items/items-controller");

// const monobank = require("../../services/banks/monobank");
// const privat24 = require("../../services/banks/privat24");

router.get("/", (req, res) => {
  const { search, reqPage, reqLimit, orderBy } = req.query
  const page = Number(reqPage) || 1;
  const limit = Number(reqLimit) || 25;

  prisma.cash_accounts.findMany({
    skip: limit * (page - 1),
    take: limit,
    orderBy: {
      id: orderBy || 'desc',
    },
    include: {
      cash_accounts_balance: true,
    },
  })
    .then(async (result) => {
      const total = await prisma.cash_accounts.count();

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

  const balanceList = req.body.balance || [];

  delete req.body.balance;

  const data = {
    ...req.body,
    id_user: req.token.id,
    created_at: dateMs,
    updated_at: dateMs
  }

  try {
    const cashAccount = await prisma.cash_accounts.create({ data: data })
    if(balanceList && balanceList.length > 0) {
      let subData = [];
      balanceList.forEach(function (item) {
        subData.push({
          ...item,
          cash_account_id: cashAccount.id
        })
      });
      await prisma.cash_accounts_balance.createMany({
        data: subData,
        skipDuplicates: false,
      })
    }

    res.json({ status: "OK",
      message: "Success"})
  } catch (e) {
    console.log(e)
    throw e
  }
});

router.get("/auxiliary/data", async (req, res) => {
  const currency = await prisma.currency.findMany();
  const typeList = [{ name: 'Касса(наличные)', value: 'cash'}, { name: 'Счет(безналичные)', value: 'account'}];

  const data = {
    currencies: currency,
    types: typeList
  };

  Promise.all([data])
    .then(elem => {
      res.json({
        status: "OK", message: data
      });
    })
    .catch(({ message }) => res.json({ status: "error", message }));

});

//router.get("/", async (req, res) => res.json({ status: "OK", message: [] }));

// // получение всех cash_and_accounts пользователя
// router.get("/", utils.isTokenValid, async (req, res) => {
//     const promises = ["cash_and_accounts", "cash_accounts_balance"].map(elem => {
//         return utils.makeQuery(query.getItems(elem), [req.token.id]);
//     });

//     Promise.all(promises)
//         .then(result => {
//             const array = result[0].map(elem => {
//                 const index = result[1].findIndex(el => el.cash_accounts_id === elem.id);

//                 if (index === -1) {
//                     return { elem, balance: balance[index] }
//                 } else {
//                     return elem
//                 }
//             });

//             res.json({ status: "OK", message: array });
//         })
//         .catch(({ message }) => res.json({ status: "error", message }));
// });

// // добавление cash_and_accounts
// router.post("/add", utils.isTokenValid, async (req, res) => {
//     const { id_type_order, name, id_user_currencies, id_bank_details, balanceIn, turnoverDebt, turnoverCred, type, stream, balance } = req.body;

//     const options = [
//         req.token.id,
//         id_type_order,
//         name,
//         id_user_currencies,
//         id_bank_details,
//         balanceIn,
//         turnoverDebt,
//         turnoverCred,
//         type,
//         JSON.stringify(stream)
//     ];

//     utils.makeQuery(query.addCashAccount, options)
//         .then((res) => {
//             if (balance) {
//                 const values = balance.map(elem => {
//                     const { currency_id, balance } = elem;

//                     return [res.insertId, currency_id, balance];
//                 });

//                 utils.dbRequest(res, [query.addBalance, [values]], "Succes");
//             } else {
//                 res.json({ status: "OK", message: "succes" });
//             }
//         })
//         .catch(({ message }) => res.json({ status: "error", message }));
// });

// // редактирование cash_and_accounts
// router.post("/:id/edit", utils.isTokenValid, async (req, res) => {
//     const { id_type_order, name, id_user_currencies, id_bank_details, balanceIn, turnoverDebt, turnoverCred, type, stream, balance } = req.body;

//     const options = [
//         id_type_order,
//         name,
//         id_user_currencies,
//         id_bank_details,
//         balanceIn,
//         turnoverDebt,
//         turnoverCred,
//         type,
//         JSON.stringify(stream),
//         req.params.id
//     ];

//     utils.makeQuery(query.editCashAccount, options)
//         .then(() => {
//             if (balance) {
//                 const values = [];
//                 // редактирование и добавление balance
//                 for (let i = 0; i < arr.length; i++) {
//                     const { id, cash_account_id, currency_id, balance } = arr[i];
//                     // если айди нет, то записываем в value
//                     if (!id) {
//                         const options = [req.params.id, currency_id, balance];

//                         values.push(options);
//                     }
//                     // если айди есть, то редактируем
//                     if (id) {
//                         const options = [currency_id, balance, req.params.id];

//                         utils.makeQuery(query.editBalance, options).catch(({ message }) => {
//                             return res.json({ status: "error", message })
//                         });
//                     }
//                 }
//                 return utils.makeQuery(query.addBalance, [values]);
//             }
//         })
//         .then(() => {
//             if (balance) utils.makeQuery(query.getBalance, [req.query.id]);
//         })
//         .then((result) => {
//             if (balance) {
//                 for (let i = 0; i < result.length; i++) {
//                     const index = balance.findIndex((el) => el.id === result[i].id);
//                     // если айди не найден, то удаляем запись
//                     if (index === -1) {
//                         return utils.makeQuery(query.removeItem("cash_accounts_balance"), [req.params.id]);
//                     }
//                 }
//             }
//         })
//         .then(() => res.json({ status: "OK", message: "Succes" }))
//         .catch(({ message }) => res.json({ status: "error", message }));
// });

// // Удаление cash_and_accounts
// router.post("/:id/remove", utils.isTokenValid, async (req, res) => {
//     db.query(query.removeItem("cash_and_accounts"), [req.params.id], (err, result) => {
//         if (err) return res.json({ status: "error", message: err.message });

//         db.query(query.removeBalance, [req.params.id], (err, result) => {
//             if (err) return res.json({ status: "error", message: err.message });

//             res.json({ status: "OK", message: "Succes" });
//         });
//     });
// });

module.exports = router;
