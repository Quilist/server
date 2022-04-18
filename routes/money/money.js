const express = require("express");
const prisma = require("../../database/database");
const router = express.Router();

router.get("/", (req, res) => {
  const { search, date_from, date_to, page, limit, orderBy } = req.query;
  
  const pageParam = Number(page) || 1;
  const limitParam = Number(limit) || 25;

  const dateSearch = search
    ? {
      created_at: {
        gte: date_from || '',
        lt: date_to || ''
      },
    }
    : {}

  const searchData = search
    ? {
      OR: [
        { note: { contains: search } },
      ],
    }
    : {}

  const date = new Date();
  const startMilliseconds = date.getTime();
  const endMilliseconds = date.getTime();

  const msPerDay = 86400 * 1000;
  const beginning = startMilliseconds - (startMilliseconds % msPerDay);

  prisma.pay.findMany({
    where: {
      created_at: {
        gte: date_from || String(beginning),
        lt: date_to || String(endMilliseconds)
      },
    },
    skip: limitParam * (pageParam - 1),
    take: limitParam,
    orderBy: {
      created_at: orderBy || 'desc',
    },
    include: {
      payments: {
        include: {
          currency: true
        }
      },
      cash_account: {
        include: {
          cash_accounts_balance: true
        }
      },
      legal_entity: true,
    },
  })
    .then(async (result) => {
      const total = await prisma.pay.count();
      // const type = req.query.type ????
      const types = {
        pay_supplier: "suppliers",
        pay_customer: "clients",
        pay_expend: "expenditure",

        receive_income: "income_items",
        receive_customer: "clients",
        receive_supplier: "suppliers"
      }

      const resultData = await Promise.all(result.map(async elem => {
        if (elem.type) {
          const typeItem = await prisma[types[elem.type]].findUnique({
            where: {
              id: Number(elem.type_id)
            }
          });
          if (typeItem) {
            elem.type_item = typeItem
          }
          return elem;
        }
      }));

      res.json({
        status: "OK", message: {
          items: resultData,
          paginations: {
            total: total,
            last_page: total <= limitParam ? 1 : total / limitParam
          }
        }
      });
    })
    .catch(err => res.json({ status: "error", message: err.message }));
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

  if (req.body.created_at === "NaN") {
    data.created_at = dateMs
  }

  try {
    const pay = await prisma.pay.create({ data: data })
    if (payList && payList.length > 0) {
      let subData = [];
      payList.forEach(function (item) {
        subData.push({
          ...item,
          pay_id: pay.id,
          created_at: dateMs,
          updated_at: dateMs
        })
      });
      await prisma.pay_type.createMany({
        data: subData,
        skipDuplicates: false,
      })
    }

    res.json({
      status: "OK",
      message: "Success"
    })
  } catch (e) {
    console.log(e)
    throw e
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
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.post("/:id/edit", async (req, res) => {
  const id = Number(req.params.id)
  await prisma.pay_type.deleteMany({ where: { pay_id: id } })

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
    await prisma.pay.update({ data: { ...data }, where: { id: id } })
    if (payList && payList.length > 0) {
      let subData = [];
      payList.forEach(function (item) {
        subData.push({
          amount: Number(item.amount),
          currency_id: Number(item.currency_id),
          type_amount: item.type_amount,
          type_pay: item.type_pay,
          pay_id: id,
          created_at: dateMs,
          updated_at: dateMs
        })
      });
      await prisma.pay_type.createMany({
        data: subData,
        skipDuplicates: false,
      })
    }

    res.json({
      status: "OK",
      message: "Success"
    })
  } catch (e) {
    console.log(e)
    throw e
  }
});

router.post("/:id/remove", (req, res) => {
  prisma.pay.delete({ where: { id: Number(req.params.id) } })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.get("/auxiliary/data", async (req, res) => {

  const type = req.query.type
  const types = {
    pay_supplier: "suppliers",
    pay_customer: "clients",
    pay_expend: "expenditure",

    receive_income: "income_items",
    receive_customer: "clients",
    receive_supplier: "suppliers"
  }

  const cashAccount = await prisma.cash_accounts.findMany({
    include: {
      cash_accounts_balance: {
        include: {
          currency: true
        }
      },
    }
  });

  const legalEntity = await prisma.legal_entites.findMany();
  const currency = await prisma.currency.findMany();

  const data = {
    cash_accounts: cashAccount,
    legal_entites: legalEntity,
    currencies: currency
  };

  if (type) {
    const itemList = await prisma[types[type]].findMany();
    data.items = itemList
  }


  Promise.all([data])
    .then(elem => {
      res.json({
        status: "OK", message: elem
      });
    })
    .catch(({ message }) => res.json({ status: "error", message }));

});

module.exports = router;