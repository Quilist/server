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

      const User = map.get(req.token.id) || 0;
      map.set(req.token.id, User + 1);

      setTimeout(() => map.delete(req.token.id), 10000);

      const items = await Promise.all(result.map(async (elem) => {
        const stream = JSON.parse(JSON.stringify(elem.stream) !== "{}" ? elem.stream : "{}")

        if (stream.privat24?.card && User === 0) {
          const info = await privat24.individualInfo(stream.privat24.card);

          elem.cash_accounts_balance[0].balance = info.balance;
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

  const card_number = req.body.stream.card_number;

  try {

    if (card_number) {

      const info = await privat24.individualInfo(card_number);
      const currency = await prisma.currency.findMany({ where: { name: info.card.currency, id_user: req.token.id } });

      data.type_order = "account";
      data.stream = JSON.stringify({
        privat24: {
          card: card_number
        }
      });

      if (currency.length) {
        data.balance = [{
          currency_id: currency[0].id,
          balance: info.balance
        }];
      } else {
        const dateMs = String(Date.now());

        const result = await prisma.currency.create({
          data: {
            name: info.card.currency,
            id_user: req.token.id,
            created_at: dateMs,
            updated_at: dateMs
          }
        });

        data.balance = [{
          currency_id: result.id,
          balance: info.balance
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

    res.json({ status: "OK", message: "Success" });
  } catch (e) {
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
  const cashBalance = await prisma.cash_accounts_balance.deleteMany({ where: { cash_account_id: Number(req.params.id) } });
  const cashAccounts = await prisma.cash_accounts.delete({ where: { id: Number(req.params.id) } });

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

  privat24.entityInfo(id, token)
    .then(result => res.json({ status: "OK", message: result }))
    .catch(e => res.json({ status: "error", message: e.message }));
});

module.exports = router;
