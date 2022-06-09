const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.post("/add", async (req, res) => {
  const dateMs = String(Date.now());

  const products = req.body.products;
  delete req.body.products;
  delete req.body.type_price_id;

  const data = {
    ...req.body,
    number: 1,
    id_user: req.token.id,
    created_at: dateMs,
    updated_at: dateMs
  }

  try {
    //save main
    const productMoving = await prisma.products_moving.create({ data: data })

    //save products
    if(products?.length > 0) {
      let productData = [];
      let product = {}
      products.forEach(function(item) {
        product = {
          ...item,
          id_user: req.token.id,
          products_moving_id: productMoving.id,
          created_at: dateMs,
          updated_at: dateMs,
        };

        productData.push(product)
      });

      //--- save related products
      const createProductPromises = productData.map((product) => {
        return prisma.products_moving_product.create({
          data: product
        })
      })
      const createdProducts = await Promise.all(createProductPromises)

      const createProductLeftoverPromisesMinus = createdProducts.map(async (product) => {
        const p = await prisma.products_leftover.findUnique({
          where: {
            product_id_storehouse_id: {
              product_id: product.product_id,
              storehouse_id: productMoving.storehouse_sender_id
            }
          },
        })

        if(p) {
          let tSum = 0, tQnt = 0;
          tSum = parseFloat( p.price ) - parseFloat( product.sum );
          tQnt = Number( p.qnt ) -  Number( product.qnt );

          return await prisma.products_leftover.update({ data: { price: tSum, qnt: tQnt }, where: { id: p.id } });
        } else {
          return await prisma.products_leftover.create({
            data: {
              qnt: product.qnt,
              storehouse_id: productMoving.storehouse_consignee_id,
              currency_id: productMoving.currency_id,
              product_id: product.product_id,
              price: product.sum,
              created_at: dateMs,
              updated_at: dateMs
            }
          })
        }

      })
      await Promise.all(createProductLeftoverPromisesMinus)

      const createProductLeftoverPromises = createdProducts.map(async (product) => {
        const p = await prisma.products_leftover.findUnique({
          where: {
            product_id_storehouse_id: {
              product_id: product.product_id,
              storehouse_id: productMoving.storehouse_consignee_id
            }
          },
        })

        if(p) {
          let tSum = 0, tQnt = 0;
          tSum = parseFloat( p.price ) + parseFloat( product.sum );
          tQnt = Number( p.qnt ) +  Number( product.qnt );

          return await prisma.products_leftover.update({ data: { price: tSum, qnt: tQnt }, where: { id: p.id } });
        } else {
          return await prisma.products_leftover.create({
            data: {
              qnt: product.qnt,
              storehouse_id: productMoving.storehouse_consignee_id,
              currency_id: productMoving.currency_id || 1,
              product_id: product.product_id,
              price: product.sum,
              created_at: dateMs,
              updated_at: dateMs
            }
          })
        }

      })
      await Promise.all(createProductLeftoverPromises)

    }

    res.json({ status: "OK",
      message: "Success"})
  } catch (e) {
    console.log(e)
    throw e
  }
});

router.get("/:id", (req, res) => {

  prisma.products_moving.findUnique({
    where: {
      id: Number(req.params.id)
    },
    include: {
      storehouse_sender: true,
      storehouse_consignee: true,
      products: {
        include: {
          product: true
        }
      }
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

router.post("/:id/edit", async (req, res) => {
  const dateMs = String(Date.now());

  const products = req.body.products;
  delete req.body.products;
  delete req.body.storehouse_consignee;
  delete req.body.storehouse_sender;

  const data = {
    ...req.body,
    updated_at: dateMs
  }

  try {
    const productMoving = await prisma.products_moving.update({ data: { ...data }, where: { id: Number(req.params.id) } });

    res.json({ status: "OK",
      message: "Success"})
  } catch (e) {
    console.log(e)
    throw e
  }

});

router.post("/:id/remove", async (req, res) => {
  const productMoving = await prisma.products_moving.findUnique({
    where: {
      id: Number(req.params.id)
    },
    include: {
      products: true
    }
  });
  
  if(productMoving.products) {
    const createProductLeftoverPromises = productMoving.products.map(async (product) => {
      const p = await prisma.products_leftover.findUnique({
        where: {
          product_id_storehouse_id: {
            product_id: product.product_id,
            storehouse_id: productMoving.storehouse_consignee_id
          }
        },
      })

      if(p) {
        let tSum = 0, tQnt = 0;
        tSum = parseFloat( p.price ) - parseFloat( product.sum );
        tQnt = Number( p.qnt ) -  Number( product.qnt );

        return await prisma.products_leftover.update({ data: { price: tSum, qnt: tQnt }, where: { id: p.id } });
      }

    })
    await Promise.all(createProductLeftoverPromises)
    
    const createProductLeftoverPromisesMinus = productMoving.products.map(async (product) => {
      const p = await prisma.products_leftover.findUnique({
        where: {
          product_id_storehouse_id: {
            product_id: product.product_id,
            storehouse_id: productMoving.storehouse_sender_id
          }
        },
      })

      if(p) {
        let tSum = 0, tQnt = 0;
        tSum = parseFloat( p.price ) + parseFloat( product.sum );
        tQnt = Number( p.qnt ) +  Number( product.qnt );

        return await prisma.products_leftover.update({ data: { price: tSum, qnt: tQnt }, where: { id: p.id } });
      }

    })
    await Promise.all(createProductLeftoverPromisesMinus)
  }

  await prisma.products_moving.delete({ where: { id: Number(req.params.id) } })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.get("/auxiliary/data", async (req, res) => {

  const onlyForAuthUser = { where: { id_user: req.token.id } };

  const storehouse = await prisma.storehouse.findMany(onlyForAuthUser);
  const measure = await prisma.measure.findMany(onlyForAuthUser);
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
    storehouses: storehouse,
    measures: measure,
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