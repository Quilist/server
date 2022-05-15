const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.post("/add", async (req, res) => {
  const dateMs = String(Date.now());

  const products = req.body.products;
  delete req.body.products;

  const data = {
    ...req.body,
    number: 1,
    id_user: req.token.id,
    created_at: dateMs,
    updated_at: dateMs
  }

  try {
    //save main
    const productImport = await prisma.products_import.create({ data: data })

    //save products
    if(products?.length > 0) {
      let productData = [];
      let product = {}
      products.forEach(function(item) {
        product = {
          ...item,
          id_user: req.token.id,
          products_import_id: productImport.id,
          created_at: dateMs,
          updated_at: dateMs,
        };

        productData.push(product)
      });

      //--- save related products
      const createProductPromises = productData.map((product) => {
        return prisma.products_import_product.create({
          data: product
        })
      })
      const createdProducts = await Promise.all(createProductPromises)

      const createProductLeftoverPromises = createdProducts.map(async (product) => {
        const p = await prisma.products_leftover.findUnique({
          where: {
            product_id_storehouse_id: {
              product_id: product.product_id,
              storehouse_id: productImport.storehouse_id
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
              storehouse_id: productImport.storehouse_id,
              currency_id: productImport.currency_id,
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

  prisma.products_import.findUnique({
    where: {
      id: Number(req.params.id)
    },
    include: {
      income_items: true,
      storehouse: true,
      type_price: true,
      currency: true,
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

  const data = {
    ...req.body,
    updated_at: dateMs
  }

  try {
    const productImport = await prisma.products_import.update({ data: { ...data }, where: { id: Number(req.params.id) } });

    res.json({ status: "OK",
      message: "Success"})
  } catch (e) {
    console.log(e)
    throw e
  }

});

router.post("/:id/remove", async (req, res) => {
  const productImport = await prisma.products_import.findUnique({
    where: {
      id: Number(req.params.id)
    },
    include: {
      products: true
    }
  });
  if(productImport.products) {
    //--- adjust storehouse balances
    const createProductLeftoverPromises = productImport.products.map(async (product) => {
      const p = await prisma.products_leftover.findUnique({
        where: {
          product_id_storehouse_id: {
            product_id: product.product_id,
            storehouse_id: productImport.storehouse_id
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
    //---
  }

  await prisma.products_import.delete({ where: { id: Number(req.params.id) } })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(err => res.json({ status: "error", message: err.message }));
});

router.get("/auxiliary/data", async (req, res) => {

  const onlyForAuthUser = { where: { id_user: req.token.id } };

  const incomeItem = await prisma.income_items.findMany(onlyForAuthUser);
  const storehouse = await prisma.storehouse.findMany(onlyForAuthUser);
  const typePrice = await prisma.type_price.findMany(onlyForAuthUser);
  const measure = await prisma.measure.findMany(onlyForAuthUser);
  const currency = await prisma.currency.findMany(onlyForAuthUser);
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
    type_prices: typePrice,
    measures: measure,
    currencies: currency,
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