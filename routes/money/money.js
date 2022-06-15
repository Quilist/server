const express = require("express");
const dateAndTime = require('date-and-time');

const prisma = require("../../database/database");
const privat24 = require("../../services/banks/privat24");
const router = express.Router();

const types = {
  pay_supplier: "suppliers",
  pay_customer: "clients",
  pay_expend: "expenditure",
  pay_salary: "employees",
  pay_owner: "user",

  receive_income: "income_items",
  receive_owner: "user",
  receive_customer: "clients",
  receive_supplier: "suppliers"
}

router.get("/", async (req, res) => {
  const { date_from, date_to, reqPage, reqLimit, orderBy } = req.query;
  const search = Number(req.query.search);

  const page = Number(reqPage) || 1;
  const limit = Number(reqLimit) || 25;

  const dateSearch = (date_from || date_to)
    ? {
      created_at: {
        gte: date_from || '',
        lt: date_to || ''
      },
    }
    : {}

  const searchData = search ? { OR: [{ number: search }] } : {};

  const params = {
    where: {
      ...dateSearch,
      ...searchData,
      id_user: req.token.id
    },
    orderBy: { created_at: orderBy || 'desc' },
  }

  prisma.pay.findMany({
    ...params,
    skip: limit * (page - 1), take: limit,
    include: {
      payments: { include: { currency: true } },
      cash_account: { include: { cash_accounts_balance: true } },
      legal_entity: true,
    },
  })
    .then(async result => {

      const currencyExchangeList = await prisma.currency_exchange.findMany({
        ...params,
        include: { from_currency: true, to_currency: true, cash_account: true }
      });

      const moneyMovingList = await prisma.moving_money.findMany({
        ...params,
        include: { currency: true, from_cash_account: true, to_cash_account: true }
      });

      const resultData = await Promise.all(result.map(async elem => {
        if (elem.type) {
          const typeItem = await prisma[types[elem.type]].findUnique({ where: { id: +elem.type_id } });

          if (typeItem) elem.type_item = typeItem
        }
        return elem;
      }));

      const data = resultData;

      if (currencyExchangeList?.length) data.push(...currencyExchangeList);
      if (moneyMovingList?.length) data.push(...moneyMovingList);

      res.json({
        status: "OK", message: {
          items: data,
          paginations: {
            total: data.length,
            last_page: data.length <= limit ? 1 : Math.round(data.length / limit)
          }
        }
      });
    })
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.get("/transations", async (req, res) => {
  const cashAccountList = await prisma.cash_accounts.findMany({ where: { id_user: req.token.id } });

  Promise.all(cashAccountList.map(async elem => {
    const { card, merchant_id, merchant_pass, acc, id, token, last } = elem.stream.privat24;

    // elem.stream.privat24.last = 1655189700000
    // await prisma.cash_accounts.update({ data: { stream: elem.stream, updated_at: String(Date.now()) }, where: { id: elem.id } });

    const pay = [];

    if (card) {
      let date = last || Infinity;
      const dateNow = Date.now();

      while (date < dateNow) {
        const math = dateNow - date < 31536000000 ? dateNow - date : 31536000000;

        const firstDate = dateAndTime.format(new Date(date), "DD.MM.YYYY");
        const lastDate = dateAndTime.format(new Date(date += math), "DD.MM.YYYY");

        const transactions = await privat24.individualTransations(card, merchant_id, merchant_pass, { first: firstDate, second: lastDate });

        if (transactions.extract) {
          Array.isArray(transactions.extract) ? pay.push(...transactions.extract) : pay.push(transactions.extract);
          elem.stream.privat24.last = Date.parse(dateAndTime.parse(`${pay[pay.length - 1].trandate} ${pay[pay.length - 1].trantime}`, "DD-MM-YYYY hh:mm:ss"));
        } else {
          elem.stream.privat24.last = date;
        }
      }
    }

    if (acc) {
      let date = last || Infinity;
      const dateNow = Date.now();

      const lastPay = await prisma.pay.findMany({ where: { id_user: req.token.id, created_at: { gte: String(last) } } });

      while (date < dateNow) {
        const firstDate = dateAndTime.format(new Date(date), "DD-MM-YYYY");
        const transactions = await privat24.entityTransation(id, token, acc, firstDate);

        const arr = [];

        transactions.transactions.forEach(data => {
          const index = lastPay.findIndex(elem => +elem?.created_at === Date.parse(dateAndTime.parse(data.DATE_TIME_DAT_OD_TIM_P, "DD.MM.YYYY hh:mm:ss")));
          const date = dateAndTime.parse(data.DATE_TIME_DAT_OD_TIM_P, "DD.MM.YYYY hh:mm:ss")

          if (index === -1 && date > last) arr.push(data);
        })

        if (arr.length) {
          pay.push(...arr);
          date = Date.parse(dateAndTime.parse(arr[arr.length - 1].DATE_TIME_DAT_OD_TIM_P, "DD.MM.YYYY hh:mm:ss"));
        }

        elem.stream.privat24.last = date;

        if (!transactions.exist_next_page) break;
      }
    }

    if (pay.length) {
      const currency = await prisma.currency.findMany({ where: { id_user: req.token.id } });

      const result = await Promise.all(pay.map(async data => {
        const { trandate, trantime, cardamount, description, OSND, CCY, DATE_TIME_DAT_OD_TIM_P, TRANTYPE, SUM } = data;

        const date = String(Date.parse((trandate && trantime) ?
          dateAndTime.parse(`${trandate} ${trantime}`, "YYYY-MM-DD hh:mm:ss") :
          dateAndTime.parse(DATE_TIME_DAT_OD_TIM_P, "DD.MM.YYYY hh:mm:ss")
        ));

        const payInfo = cardamount?.split(" ") || [];
        const index = currency.findIndex(elem => elem.name === payInfo[1] || CCY);

        return await prisma.pay.create({
          data: {
            id_user: req.token.id,
            number: 1,
            cash_account_id: elem.id,
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
        });
      }))

      await prisma.cash_accounts.update({ data: { stream: elem.stream, updated_at: String(Date.now()) }, where: { id: elem.id } });

      return await prisma.pay.findMany({
        where: { id_user: req.token.id, id: { gte: result[0].id } },
        include: {
          payments: { include: { currency: true } },
          cash_account: { include: { cash_accounts_balance: true } },
        },
      });
    }
  }))
    .then(result => res.json({ status: "OK", message: { items: result[0] || [] } }))
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.post("/add", async (req, res) => {
  const dateMs = String(Date.now());

  const paymentList = req.body.payments || [];
  const changeList = req.body.changes || [];
  const totalList = req.body.totals || [];
  const payList = [...paymentList, ...changeList, ...totalList];

  delete req.body.payments;
  delete req.body.changes;
  delete req.body.totals;

  const data = {
    ...req.body,
    id_user: req.token.id,
    number: 1,
    updated_at: dateMs
  }

  if (req.body.created_at === "NaN") data.created_at = dateMs;

  try {
    const pay = await prisma.pay.create({ data: data });

    if (payList.length) {

      const subData = payList.map(elem => {
        return {
          ...elem,
          pay_id: pay.id,
          created_at: dateMs,
          updated_at: dateMs
        }
      });

      await prisma.pay_type.createMany({ data: subData, skipDuplicates: false })
    }

    res.json({ status: "OK", message: "Success" });
  } catch (e) {
    res.json({ status: "error", message: e.message });
  }
});

router.get("/:id", (req, res) => {

  prisma.pay.findUnique({
    where: {
      id: Number(req.params.id)
    },
    include: {
      payments: {
        include: {
          currency: true
        }
      },
      cash_account: {
        include: {
          cash_accounts_balance: {
            include: {
              currency: true
            }
          },
        }
      },
      legal_entity: true,
    },
  })
    .then((result) => {
      if (!result) return res.json({ status: "error", message: "Unknown id" });

      if (result.id_user !== req.token.id) {
        return res.json({ status: "error", message: "Action not allowed" });
      }

      res.json({ status: "OK", message: result });
    })
    .catch(e => res.json({ status: "error", message: e.message }));
});

router.post("/:id/edit", async (req, res) => {
  const id = Number(req.params.id)

  await prisma.pay_type.deleteMany({ where: { pay_id: id } }); // ???

  const dateMs = String(Date.now());

  const paymentList = req.body.payments || [];
  const changeList = req.body.changes || [];
  const totalList = req.body.totals || [];
  const payList = [...paymentList, ...changeList, ...totalList];

  delete req.body.payments;
  delete req.body.changes;
  delete req.body.totals;

  if (req.body.created_at === "NaN") {
    delete req.body.created_at;
  }

  const data = {
    ...req.body,
    updated_at: dateMs
  }

  try {
    await prisma.pay.update({ data: data, where: { id: id } });

    if (payList.length) {

      const subData = payList.map(elem => {
        return {
          amount: Number(elem.amount),
          currency_id: Number(elem.currency_id),
          type_amount: elem.type_amount,
          type_pay: elem.type_pay,
          pay_id: id,
          created_at: dateMs,
          updated_at: dateMs
        }
      });

      await prisma.pay_type.createMany({ data: subData, skipDuplicates: false });
    }

    res.json({ status: "OK", message: "Success" });
  } catch (e) {
    res.json({ status: "error", message: e.message });
  }
});

router.post("/:id/remove", (req, res) => {
  prisma.pay.delete({ where: { id: Number(req.params.id) } })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.get("/auxiliary/data", async (req, res) => {

  const type = req.query.type;

  const cashAccount = await prisma.cash_accounts.findMany({
    include: {
      cash_accounts_balance: {
        include: {
          currency: true
        }
      },
      legal_entites: true,
    },
    where: {
      id_user: req.token.id
    }
  });

  const legalEntity = await prisma.legal_entites.findMany({ where: { id_user: req.token.id }, include: { cash_accounts: true } });
  const currency = await prisma.currency.findMany({ where: { id_user: req.token.id } });
  const userSettings = await prisma.user_settings.findUnique({
    where: {
      id: Number(req.token.id)
    }
  });

  const data = {
    cash_accounts: cashAccount,
    legal_entites: legalEntity,
    currencies: currency,
    user_settings: userSettings
  };

  if (type) {
    const itemList = await prisma[types[type]].findMany({ where: { id_user: req.token.id } });

    data.items = itemList
  }

  Promise.all([data])
    .then(elem => res.json({ status: "OK", message: elem }))
    .catch(({ message }) => res.json({ status: "error", message }));
});

module.exports = router;
