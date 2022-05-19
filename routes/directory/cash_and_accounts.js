const express = require("express");

const prisma = require("../../database/database");
const router = express.Router();

const privat24 = require("../../services/banks/privat24");

const map = new Map();

router.get("/", (req, res) => {
  const { orderBy } = req.query
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

  prisma.cash_accounts.findMany({
    skip: limit * (page - 1),
    take: limit,
    orderBy: {
      id: orderBy || 'desc',
    },
    include: {
      cash_accounts_balance: true,
    },
    where: { id_user: req.token.id }
  })
    .then(async (result) => {
      const total = await prisma.cash_accounts.count({ where: { id_user: req.token.id } });

      const user = map.get(req.token.id);
      map.set(req.token.id, user + 1);
      setTimeout(() => map.delete(req.token.id), 10000);

      const items = await Promise.all(result.map(async (elem) => {

        if (user === 0) {
          if (elem.privat24?.card) {
            const info = await privat24.individualInfo(elem.privat24.card, elem.privat24.merchant_id, elem.privat24.merchant_pass);

            elem.cash_accounts_balance[0].balance = info.balance.balance;
          }

          if (elem.privat24?.acc) {
            const info = await privat24.entityInfo(elem.privat24.id, elem.privat24.token)

            const index = info.findIndex(data => data.acc === elem.privat24.acc);

            if (index !== -1) elem.cash_accounts_balance[0].balance = info[index].balanceIn;
          }
        }

        return elem;
      }));

      res.json({
        status: "OK", message: {
          items: items,
          paginations: {
            total: total,
            last_page: total <= limit ? 1 : total / limit
          }
        }
      });
    })
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.post("/add", async (req, res) => {
  const dateMs = String(Date.now());

  const data = {
    ...req.body,
    id_user: req.token.id,
    created_at: dateMs,
    updated_at: dateMs
  }

  const { card_number, acc, balance, id, token, merchant_id, merchant_pass, date } = req.body.stream;

  try {
    // приват24 физ лица
    const pay = [];

    if (card_number) {
      const info = await privat24.individualInfo(card_number, merchant_id, merchant_pass, date);

      data.type_order = "account";
      data.stream = {
        privat24: {
          card: card_number,
          merchant_id: merchant_id,
          merchant_pass: merchant_pass
        }
      };

      Array.isArray(info.extract) ? pay.push(...info.extract) : pay.push(info.extract);

      req.body.stream.currency = info.balance.card.currency;
      req.body.stream.balance = info.balance.balance
    }
    // приват24 юр лица
    if (acc) {
      data.type_order = "account";
      data.stream = { privat24: { acc: acc, id: id, token: token } };
    }
    // Добавление балансе, а так же проверка на существование валюты
    if (card_number || acc) {
      const currency = req.body.stream.currency;
      const amount = req.body.stream.balance || balance;

      const pCurrency = await prisma.currency.findMany({ where: { name: currency, id_user: req.token.id } });

      if (pCurrency.length) {
        data.balance = [{ currency_id: pCurrency[0].id, balance: amount }];
      } else { // создаем валюту, если ее нет
        const dateMs = String(Date.now());

        const result = await prisma.currency.create({
          data: {
            name: currency,
            id_user: req.token.id,
            created_at: dateMs,
            updated_at: dateMs
          }
        });

        data.balance = [{
          currency_id: result.id,
          balance: amount
        }];
      }
    }

    const balanceList = data.balance || [];
    delete data.balance;

    const cashAccount = await prisma.cash_accounts.create({ data: data });

    if (balanceList.length) {

      const subData = balanceList.map(elem => {
        return {
          ...elem,
          cash_account_id: cashAccount.id
        }
      });

      await prisma.cash_accounts_balance.createMany({ data: subData, skipDuplicates: false })
    }

    if (pay.length) {
      const currency = await prisma.currency.findMany({ where: { id_user: req.token.id } });

      const payTypeData = [];

      const payData = pay.map(elem => {
        const date = String(Date.parse(`${elem.trandate} ${elem.trantime}`));

        const payInfo = elem.cardamount.split(" ");
        const index = currency.findIndex(elem => elem.name === payInfo[1]);

        payTypeData.push({
          currency_id: currency[index].id,
          amount: Number(payInfo[0]),
          type_pay: "payment",
          type_amount: "debit",
          created_at: date,
          updated_at: date
        })

        return {
          id_user: req.token.id,
          number: 1,
          cash_account_id: cashAccount.id,
          type_order: "bank_account",
          created_at: date,
          updated_at: date
        }
      });

      const payInfo = await prisma.pay.createMany({ data: payData, skipDuplicates: false });

      for (let i = 0; i < payInfo.length; i++) payTypeInfo[i].pay_id = payInfo[i].id;

      await prisma.pay_type.createMany({ data: payTypeData, skipDuplicate: false });
    }

    res.json({ status: "OK", message: "Success" });
  } catch (e) {
    console.log(e.message)
    res.json({ status: "error", message: e.message });
  }
});

router.get("/auxiliary/data", async (req, res) => {
  prisma.currency.findMany({ where: { id_user: req.token.id } })
    .then(result => {
      const typeList = [{ name: 'Касса(наличные)', value: 'cash' }, { name: 'Счет(безналичные)', value: 'account' }];

      res.json({ status: "OK", message: { currencies: result, types: typeList } });
    })
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.post("/:id/remove", async (req, res) => {
  const id = Number(req.params.id);

  const cashBalance = await prisma.cash_accounts_balance.deleteMany({ where: { cash_account_id: id } });
  const cashAccounts = await prisma.cash_accounts.delete({ where: { id: id } });

  Promise.all([cashBalance, cashAccounts])
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.post("/:id/edit", async (req, res) => {
  prisma.cash_accounts.update({
    where: { id: Number(req.params.id) },
    data: {
      name: req.body.name,
      updated_at: String(Date.now())
    }
  })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.get("/account", async (req, res) => {
  const { id, token } = req.query;

  privat24.entityInfo(id, token.split(" ").join("+"))
    .then(result => res.json({ status: "OK", message: result }))
    .catch(e => res.json({ status: "error", message: e.message }));
});

module.exports = router;
