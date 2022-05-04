const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.get("/", (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

  prisma.buy_sell.findMany({
    skip: limit * (page - 1), take: limit,
    where: {
      status: req.query.type
    },
    include: {
      storehouse: true,
      client: true,
      supplier: true,
      currency: true
    },
  })
    .then(async (result) => {
      const total = await prisma.buy_sell.count();

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

  const products = req.body.products;
  delete req.body.products;

  const data = {
    ...req.body,
    id_user: req.token.id,
    created_at: dateMs,
    updated_at: dateMs
  }

  data.number = 1;

  try {
    //save main
    const buySell = await prisma.buy_sell.create({ data: data })

    //save products
    if(products?.length > 0) {
      let productData = [];
      let product = {}
      products.forEach(function(item) {
        product = {
          ...item,
          id_user: req.token.id,
          buy_sell_id: buySell.id,
          created_at: dateMs,
          updated_at: dateMs,
        };

        productData.push(product)
      });

      const createProductPromises = productData.map((product) => {
        return prisma.buy_sell_product.create({
          data: product
        })
      })

      await Promise.all(createProductPromises)
    }

    res.json({ status: "OK",
      message: "Success"})
  } catch (e) {
    console.log(e)
    throw e
  }
});

router.get("/:id", (req, res) => {

  prisma.buy_sell.findUnique({
    where: {
      id: Number(req.params.id)
    },
    include: {
      products: true,
    },
  })
    .then(async (result) => {
      if (!result) return res.json({ status: "error", message: "Unknown id" });

      if (result.id_user !== req.token.id) {
        return res.json({ status: "error", message: "Action not allowed" });
      }

      res.json({ status: "OK", message: result });
    })
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.post("/:id/remove", async (req, res) => {
  await prisma.buy_sell.delete({ where: { id: Number(req.params.id) } })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(err => res.json({ status: "error", message: err.message }));
});


router.get("/auxiliary/data", async (req, res) => {
  const query = req.query;
  const onlyForAuthUser = { where: { id_user: req.token.id } };

  let status = [];

  const storehouse = await prisma.storehouse.findMany(onlyForAuthUser);
  const legalEntity = await prisma.legal_entites.findMany(onlyForAuthUser);
  const typePrice = await prisma.type_price.findMany(onlyForAuthUser);
  const currency = await prisma.currency.findMany(onlyForAuthUser);

  const productList = await prisma.products.findMany(
    {
      where: {
        id_user: req.token.id,
        parent_id: null,
        type: {
          in: ['product', 'service'],
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
    storehouses: storehouse,
    legal_entities: legalEntity,
    type_prices: typePrice,
    currencies: currency,
    products: productList
  };

  if(query.type === 'sell') {
    status = [{name: 'Продажа', id: 'sale'}, {name: 'Заказ', id: 'order'}];
    const client = await prisma.clients.findMany(onlyForAuthUser);
    const seller = await prisma.employees.findMany({
      where: {
        id_user: req.token.id,
        id_role: 'Менеджер'
      }
    });
    const courier = await prisma.employees.findMany({
      where: {
        id_user: req.token.id,
        id_role: 'Курьер/водитель'
      }
    });
    data.statuses = status
    data.clients = client
    data.sellers = seller
    data.couriers = courier
  }

  if(query.type === 'buy') {
    status = [{name: 'Закупка', value: 'purchase'}, {name: 'Заказ поставщику', value: 'order'}];
    const supplier = await prisma.suppliers.findMany(onlyForAuthUser);
    data.statuses = status
    data.suppliers = supplier
  }

  Promise.all([data])
    .then(elem => {
      res.json({
        status: "OK", message: data
      });
    })
    .catch(({ message }) => res.json({ status: "error", message }));

});

module.exports = router;