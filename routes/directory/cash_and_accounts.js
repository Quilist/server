const express = require("express");
const itemsController = require("../../controllers/items/items-controller");
const prisma = require("../../database/database");
const router = express.Router();

router.get("/", (req, res) => {
  const { reqPage, reqLimit, orderBy } = req.query
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
    where: { id_user: Number(req.token.id) }
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
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.post("/add", async (req, res) => {
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
  const currency = await prisma.currency.findMany({ where: { id_user: Number(req.token.id) } });
  const typeList = [{ name: 'Касса(наличные)', value: 'cash' }, { name: 'Счет(безналичные)', value: 'account' }];

  const data = { currencies: currency, types: typeList };

  Promise.all([data])
    .then(elem => { res.json({ status: "OK", message: elem[0] }) })
    .catch(e => res.json({ status: "error", message: e.message }));
});

module.exports = router;
