const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.get("/auxiliary/data", async (req, res) => {

  const onlyForAuthUser = { where: { id_user: req.token.id } };

  const incomeItem = await prisma.income_items.findMany(onlyForAuthUser);
  const storehouse = await prisma.storehouse.findMany(onlyForAuthUser);
  const measure = await prisma.measure.findMany(onlyForAuthUser);
  const currency = await prisma.currency.findMany(onlyForAuthUser);
  const typePrice = await prisma.type_price.findMany(onlyForAuthUser);
  const productList = await prisma.products.findMany(
    {
      where: {
        id_user: req.token.id,
        parent_id: null,
        type: {
          in: ['product'],
        },
      },
      include: {
        measure: true,
        prices: {
          include: {
            type_price: true
          }
        },
        leftovers: {
          include: {
            storehouse: true
          }
        }
      },
    }
  );

  const data = {
    income_items: incomeItem,
    storehouses: storehouse,
    measures: measure,
    currencies: currency,
    type_prices: typePrice,
    products: productList
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