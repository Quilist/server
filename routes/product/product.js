const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.get("/", (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    prisma.products.findMany({
      skip: limit * (page - 1), take: limit,
      where: {
        parent_id: null
      },
      include: {
        measure: true,
        prices: true
      },
    })
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

router.post("/add", async(req, res) => {
  const dateMs = String(Date.now());

  const prices = req.body.prices;
  const leftovers = req.body.leftovers;
  const childs = req.body.childs;
  delete req.body.prices;
  delete req.body.leftovers;
  delete req.body.childs;

  const data = {
    ...req.body,
    id_user: req.token.id,
    created_at: dateMs,
    updated_at: dateMs
  }

  try {
    //save main
    const product = await prisma.products.create({ data: data })

    //save prices
    if(prices?.length > 0) {
      let priceData = [];
      prices.forEach(function (item) {
        priceData.push({
          ...item,
          product_id: product.id,
          created_at: dateMs,
          updated_at: dateMs
        })
      });

      await prisma.products_price.createMany({
        data: priceData
      })
    }

    //save leftovers
    if(leftovers?.length > 0) {
      let leftoverData = [];
      leftovers.forEach(function (item) {
        leftoverData.push({
          ...item,
          product_id: product.id,
          created_at: dateMs,
          updated_at: dateMs
        })
      });

      await prisma.products_leftover.createMany({
        data: leftoverData
      })
    }

    //save childs
    if(childs?.length > 0 && product.type === 'product') {
      let childData = [];
      let child = {}
      childs.forEach(function(item) {
        const pricesItem = item.prices;
        const leftoversItem = item.leftovers;
        delete item.prices;
        delete item.leftovers;

        child = {
          ...item,
          type: product.type,
          id_user: req.token.id,
          parent_id: product.id,
          created_at: dateMs,
          updated_at: dateMs,
        };

        //save prices
        if(pricesItem?.length > 0) {
          let priceData = [];
          pricesItem.forEach(function (itemPrice) {
            priceData.push({
              ...itemPrice,
              created_at: dateMs,
              updated_at: dateMs
            })
          });
          child.prices = {
            create: priceData,
          }
        }

        //save leftovers
        if(leftoversItem?.length > 0) {
          let leftoverData = [];
          leftoversItem.forEach(function (itemLeftover) {
            leftoverData.push({
              ...itemLeftover,
              created_at: dateMs,
              updated_at: dateMs
            })
          });
          child.leftovers = {
            create: leftoverData,
          }
        }

        childData.push(child)
      });

      const createProductPromises = childData.map((child) => {
        return prisma.products.create({
          data: child
        })
      })

      await Promise.all(createProductPromises)
    }

    if(childs?.length > 0 && product.type === 'set') {
      let childData = [];
      childs.forEach(function (item) {
        childData.push({
          product_id: product.id,
          product_child_id: item.id,
          min_stock: item.min_stock
        })
      });

      await prisma.products_childs.createMany({
        data: childData
      })
    }

    res.json({ status: "OK",
      message: "Success"})
  } catch (e) {
    console.log(e)
    throw e
  }
});


router.get("/:id", (req, res) => {

    prisma.products.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        prices: true,
        leftovers: {
          include: {
            storehouse: true
          }
        },
        childs: true,
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


router.post("/:id/edit", (req, res) => {
  const dateMs = String(Date.now());

  const prices = req.body.prices;
  const leftovers = req.body.leftovers;
  const childs = req.body.childs;
  delete req.body.prices;
  delete req.body.leftovers;
  delete req.body.childs;

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

  const typeList = [{name: 'Товар', value: 'product'}, {name: 'Комплект', value: 'set'}, {name: 'Услуга', value: 'service'}];
  const storehouse = await prisma.storehouse.findMany();
  const typePrice = await prisma.type_price.findMany();
  const measure = await prisma.measure.findMany();
  const supplier = await prisma.suppliers.findMany();
  const group = await prisma.products_groups.findMany();
  const currency = await prisma.currency.findMany();
  const colorList = await prisma.products_colors.findMany();
  const sizeList = await prisma.products_sizes.findMany();
  const productList = await prisma.products.findMany(
    {
      where: {
        parent_id: null,
        type: {
          in: ['product', 'service'],
        },
      }
    }
  );

  const data = {
    storehouses: storehouse,
    type_prices: typePrice,
    measures: measure,
    suppliers: supplier,
    groups: group,
    types: typeList,
    currencies: currency,
    colors: colorList,
    sizes: sizeList,
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