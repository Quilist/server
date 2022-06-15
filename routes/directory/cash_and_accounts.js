const express = require("express");
const dateAndTime = require('date-and-time');

const prisma = require("../../database/database");
const router = express.Router();

const privat24 = require("../../services/banks/privat24");

router.get("/", (req, res) => {
  const { orderBy } = req.query;
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

      const items = await Promise.all(result.map(async elem => {
        if (elem.stream.privat24) {
          const { card, acc, merchant_id, merchant_pass, id, token } = elem.stream.privat24

          if (card) {
            const info = await privat24.individualInfo(card, merchant_id, merchant_pass);

            elem.cash_accounts_balance[0].balance = info.balance.balance;
          }

          if (acc) {
            const info = await privat24.entityInfo(id, token)
            const index = info.balances.findIndex(data => data.acc === acc);

            if (index !== -1) elem.cash_accounts_balance[0].balance = info.balances[index].balanceIn;
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

  const { card_number, acc, balance, id, token, merchant_id, merchant_pass, first } = req.body.stream;

  try {
    const pay = [];
    // приват24 физ лица
    if (card_number) {
      const info = await privat24.individualInfo(card_number, merchant_id, merchant_pass);

      data.stream = {
        privat24: {
          card: card_number,
          merchant_id: merchant_id,
          merchant_pass: merchant_pass
        }
      };

      let date = Date.parse(dateAndTime.parse(first, "DD.MM.YYYY")) || Infinity;
      const dateNow = Date.now();

      while (date < dateNow) {
        const math = dateNow - date < 31536000000 ? dateNow - date : 31536000000;

        const firstDate = dateAndTime.format(new Date(date), "DD.MM.YYYY");
        const lastDate = dateAndTime.format(new Date(date += math), "DD.MM.YYYY");

        const transactions = await privat24.individualTransations(card_number, merchant_id, merchant_pass, { first: firstDate, second: lastDate });

        if (transactions.extract) {
          const arr = Array.isArray(transactions.extract) ? [...transactions.extract] : [transactions.extract];
          const filter = arr.filter(elem => elem.card === card_number);

          if (filter.length) {
            pay.push(...filter);
            data.stream.privat24.last = Date.parse(dateAndTime.parse(`${pay[pay.length - 1].trandate} ${pay[pay.length - 1].trantime}`, "YYYY-MM-DD hh:mm:ss"));
          }
        } else {
          data.stream.privat24.last = date;
        }
      }

      req.body.stream.currency = info.balance.card.currency;
      req.body.stream.balance = info.balance.balance
    }
    // приват24 юр лица
    if (acc) {
      data.stream = { privat24: { acc: acc, id: id, token: token } };

      let date = Date.parse(dateAndTime.parse(first, "DD.MM.YYYY")) || Infinity;
      const dateNow = Date.now();

      while (date < dateNow) {
        const firstDate = dateAndTime.format(new Date(date), "DD-MM-YYYY");
        const transactions = await privat24.entityTransation(id, token, acc, firstDate);

        if (transactions.transactions.length) {
          pay.push(...transactions.transactions);
          date = Date.parse(dateAndTime.parse(pay[pay.length - 1].DATE_TIME_DAT_OD_TIM_P, "DD.MM.YYYY hh:mm:ss"));
        }

        data.stream.privat24.last = date;

        if (!transactions.exist_next_page) break;
      }
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

      pay.forEach(async data => {
        const { trandate, trantime, cardamount, description, OSND, CCY, DATE_TIME_DAT_OD_TIM_P, SUM, TRANTYPE } = data;

        const date = String(Date.parse((trandate && trantime) ?
          dateAndTime.parse(`${trandate} ${trantime}`, "YYYY-MM-DD hh:mm:ss") :
          dateAndTime.parse(DATE_TIME_DAT_OD_TIM_P, "DD.MM.YYYY hh:mm:ss")
        ));

        const payInfo = cardamount?.split(" ") || [];
        const index = currency.findIndex(elem => elem.name === payInfo[1] || CCY);

        await prisma.pay.create({
          data: {
            id_user: req.token.id,
            number: 1,
            cash_account_id: cashAccount.id,
            type_order: "bank_account",
            note: description || OSND,
            created_at: date,
            updated_at: date,
            payments: {
              create: {
                currency_id: currency[index].id,
                amount: payInfo[1] ? +payInfo[0] : TRANTYPE === "D" ? -SUM : +SUM,
                type_pay: "payment",
                type_amount: "debit",
                created_at: date,
                updated_at: date
              }
            }
          }
        })
      });
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
  const id = Number(req.params.id);

  const pay = await prisma.pay.deleteMany({ where: { cash_account_id: id } });
  const cash_account = await prisma.cash_accounts.delete({ where: { id: id } });

  Promise.all([pay, cash_account])
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
    .then(result => res.json({ status: "OK", message: result.balances }))
    .catch(e => res.json({ status: "error", message: e.message }));
});

module.exports = router;