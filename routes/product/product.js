const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const itemsController = require("../../controllers/items/items-controller");

router.get("/", itemsController.all);
router.get("/:id", itemsController.id);
router.post("/:id/edit", itemsController.edit);
router.post("/:id/remove", itemsController.delete);

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
    const product = await prisma.products.create({ data: data });

    if (amountData.length) {

      const subData = amountData.map(elem => {
        return {
          ...elem,
          product_id: product.id,
          created_at: dateMs,
          updated_at: dateMs
        }
      });

      await prisma.products_amount_data.createMany({ data: subData });
    }

    res.json({ status: "OK", message: "Success" });
  } catch (e) {
    res.json({ status: "error", message: e.message });
  }
});

router.get("/auxiliary/data", async (req, res) => {

  const typeList = [{ name: 'Товар', value: 'product' }, { name: 'Комплект', value: 'set' }, { name: 'Услуга', value: 'service' }];

  const tables = ["storehouse", "type_price", "measure", "suppliers", "products_groups", "currency"];

  const promises = tables.map(async (elem) => {
    return await prisma[elem].findMany({ where: { id_user: Number(req.token.id) } });
  });

  Promise.all(promises)
    .then(elem => {

      const data = {
        storehouses: elem[0],
        type_prices: elem[1],
        measures: elem[2],
        suppliers: elem[3],
        groups: elem[4],
        types: typeList,
        currencies: elem[5]
      };

      res.json({ status: "OK", message: data });
    })
    .catch(e => res.json({ status: "error", message: e.message }));
});

module.exports = router;