const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.get("/", (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

  prisma.products.findMany({ skip: limit * (page - 1), take: limit, where: { id_user: Number(req.token.id) } })
    .then(async (result) => {
      const total = await prisma.products.count();

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

router.post("/add", async (req, res) => {
  const dateMs = String(Date.now());

  const amountData = req.body.amount_data;
  delete req.body.amount_data;

  const data = {
    ...req.body,
    id_user: req.token.id,
    created_at: dateMs,
    updated_at: dateMs
  }

  try {
    const product = await prisma.products.create({ data: data })
    if (amountData && amountData.length > 0) {
      let subData = [];
      amountData.forEach(function (item) {
        subData.push({
          ...item,
          product_id: product.id,
          created_at: dateMs,
          updated_at: dateMs
        })
      });

      await prisma.products_amount_data.createMany({
        data: subData
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

  prisma.products.findUnique({ where: { id: Number(req.params.id) } })
    .then((result) => {
      if (!result) return res.json({ status: "error", message: "Unknown id" });

      if (result.id_user !== req.token.id) {
        return res.json({ status: "error", message: "Action not allowed" });
      }

      res.json({ status: "OK", message: result });
    })
    .catch(err => res.json({ status: "error", message: err.message }));
});


router.post("/:id/edit", (req, res) => {
  const dateMs = String(Date.now());

  const data = {
    ...req.body,
    updated_at: dateMs
  }

  prisma.products.update({ data: { ...data }, where: { id: Number(req.params.id) } })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.post("/:id/remove", (req, res) => {
  prisma.products.delete({ where: { id: Number(req.params.id) } })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.get("/auxiliary/data", async (req, res) => {

  const typeList = [{ name: 'Товар', value: 'product' }, { name: 'Комплект', value: 'set' }, { name: 'Услуга', value: 'service' }];

  const tables = ["storehouse", "type_price", "measure", "suppliers", "products_groups", "currency"];

  const promises = tables.map(async (elem) => {
    return await prisma[elem].findMany({ where: { id_user: Number(req.token.id) } });
  });

  const data = {
    storehouses: promises[0],
    type_prices: promises[1],
    measures: promises[2],
    suppliers: promises[3],
    groups: promises[4],
    types: typeList,
    currencies: promises[5]
  };

  Promise.all([data])
    .then(elem => {
      res.json({
        status: "OK", message: data
      });
    })
    .catch(({ message }) => res.json({ status: "error", message }));

});

module.exports = router;