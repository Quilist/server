const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.get("/", (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    prisma.product.findMany({ skip: limit * (page - 1), take: limit })
        .then(async (result) => {
            const total = await prisma.product.count();

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

router.post("/add", (req, res) => {
    const dateMs = String(Date.now());

    const data = {
      ...req.body,
      id_user: req.token.id,
      created_at: dateMs,
      updated_at: dateMs
    }

    prisma.product.create({ data: data })
        .then(() => res.json({ status: "OK", message: "Success" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});


router.get("/:id", (req, res) => {

    prisma.product.findUnique({ where: { id: Number(req.params.id) } })
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

    prisma.product.update({ data: { ...data }, where: { id: Number(req.params.id) } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

router.post("/:id/remove", (req, res) => {
    prisma.product.delete({ where: { id: Number(req.params.id) } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

router.get("/auxiliary/data", async (req, res) => {

  const typeList = [{name: 'Товар', value: 'product'}, {name: 'Комплект', value: 'set'}, {name: 'Услуга', value: 'service'}];
  const storehouse = await prisma.storeHouse.findMany();
  const typePrice = await prisma.typePrice.findMany();
  const unit = await prisma.unit.findMany();
  const supplier = await prisma.supplier.findMany();
  const group = await prisma.productGroup.findMany();
  const currency = await prisma.currency.findMany();

  const data = {
    storehouses: storehouse,
    type_prices: typePrice,
    units: unit,
    suppliers: supplier,
    groups: group,
    types: typeList,
    currencies: currency
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