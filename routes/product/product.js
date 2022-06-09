const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.get("/", (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    prisma.products.findMany({
      skip: limit * (page - 1), take: limit,
      where: {
        id_user: req.token.id,
        parent_id: null
      },
      include: {
        measure: true,
        prices: {
          include: {
            currency: true
          }
        },
        leftovers: true,
      },
    })
        .then(async (result) => {
            const total = await prisma.products.count({where: {id_user: req.token.id}});

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
            currency: true,
            storehouse: true
          }
        },
        childs: {
          include: {
            product_child: true
          }
        },
      },
    })
        .then(async (result) => {
          if(result.type === 'product') {
            const productChildList = await prisma.products.findMany(
              {
                where: {
                  id_user: req.token.id,
                  parent_id: result.id
                },
                include: {
                  prices: true,
                  leftovers: {
                    include: {
                      currency: true,
                      storehouse: true
                    }
                  },
                },
              }
            );
            result.childs = productChildList;
          }
            if (!result) return res.json({ status: "error", message: "Unknown id" });

            if (result.id_user !== req.token.id) {
                return res.json({ status: "error", message: "Action not allowed" });
            }

            res.json({ status: "OK", message: result });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});


router.post("/:id/edit", async (req, res) => {
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

  try {
    //save main
    const product = await prisma.products.update({ data: { ...data }, where: { id: Number(req.params.id) } });

    //save prices
    if(prices?.length > 0) {
      await prisma.products_price.deleteMany({ where: { product_id: product.id } });
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

    //save childs
    if(childs?.length > 0 && product.type === 'product') {
      await prisma.products.deleteMany({ where: { parent_id: product.id } });
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
              name: itemPrice.name,
              price: itemPrice.price,
              currency_id: itemPrice.currency_id,
              created_at: dateMs,
              updated_at: dateMs
            })
          });
          child.prices = {
            create: priceData,
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
      await prisma.products_childs.deleteMany({ where: { product_id: product.id } });
      let childData = [];
      childs.forEach(function (item) {
        childData.push({
          product_id: product.id,
          product_child_id: item.product_child_id ? item.product_child_id : item.id,
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

router.post("/:id/remove", async (req, res) => {
  await prisma.products.deleteMany({ where: { parent_id: Number(req.params.id) } });
  await prisma.products.delete({ where: { id: Number(req.params.id) } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

router.get("/auxiliary/data", async (req, res) => {

  const onlyForAuthUser = { where: { id_user: req.token.id } };
  const typeList = [{name: 'Товар', value: 'product'}, {name: 'Комплект', value: 'set'}, {name: 'Услуга', value: 'service'}];
  const storehouse = await prisma.storehouse.findMany(onlyForAuthUser);
  const typePrice = await prisma.type_price.findMany(onlyForAuthUser);
  const measure = await prisma.measure.findMany(onlyForAuthUser);
  const supplier = await prisma.suppliers.findMany(onlyForAuthUser);
  const group = await prisma.products_groups.findMany(onlyForAuthUser);
  const currency = await prisma.currency.findMany(onlyForAuthUser);
  const colorList = await prisma.products_colors.findMany(onlyForAuthUser);
  const sizeList = await prisma.products_sizes.findMany(onlyForAuthUser);
  const productList = await prisma.products.findMany(
    {
      where: {
        id_user: req.token.id,
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