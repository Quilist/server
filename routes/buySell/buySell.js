const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.get("/", (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

  prisma.buy_sell.findMany({
    skip: limit * (page - 1), take: limit,
    where: {
      type: req.query.type
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

      //--- save related products
      const createProductPromises = productData.map((product) => {
        return prisma.buy_sell_product.create({
          data: product
        })
      })
      await Promise.all(createProductPromises)
      //---


      if(['purchase', 'sale'].includes(buySell.type_doc)) {
        //--- adjust storehouse balances
        const createProductLeftoverPromises = productData.map(async (product) => {
          const p = await prisma.products_leftover.findUnique({
            where: {
              product_id_storehouse_id: {
                product_id: product.product_id,
                storehouse_id: buySell.storehouse_id
              }
            },
          })

          if(p) {
            let tSum = 0, tQnt = 0;
            if(buySell.type == 'sell') {
              tSum = parseFloat( p.price ) - parseFloat( product.sum );
              tQnt = Number( p.qnt ) -  Number( product.qnt );
            }
            if(buySell.type == 'buy') {
              tSum = parseFloat( p.price ) + parseFloat( product.sum );
              tQnt = Number( p.qnt ) +  Number( product.qnt );
            }

            return await prisma.products_leftover.update({ data: { price: tSum, qnt: tQnt }, where: { id: p.id } });
          } else {
            return await prisma.products_leftover.create({
              data: {
                qnt: product.qnt,
                storehouse_id: buySell.storehouse_id,
                currency_id: buySell.currency_id,
                product_id: product.product_id,
                price: product.sum,
                created_at: dateMs,
                updated_at: dateMs
              }
            })
          }
        })
        await Promise.all(createProductLeftoverPromises)
        //---

        if(buySell.type == 'sell') {
          const client = await prisma.clients.findUnique({
            where: {
              id: buySell.client_id
            },
          })

          const debitSum = parseFloat( client.debit) +  parseFloat( buySell.sum);
          const clientData = {
            debit: debitSum
          }
          await prisma.clients.update({ data: clientData, where: { id: buySell.client_id } });
        }

        if(buySell.type == 'buy') {
          const supplier = await prisma.suppliers.findUnique({
            where: {
              id: buySell.supplier_id
            },
          })

          const debitSum = parseFloat( supplier.credit) +  parseFloat( buySell.sum);
          const supplierData = {
            credit: debitSum
          }
          await prisma.suppliers.update({ data: supplierData, where: { id: buySell.supplier_id } });
        }
      }

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
      products: {
        include: {
          product: true
        }
      },
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
  const buySell = await prisma.buy_sell.findUnique({
    where: {
      id: Number(req.params.id)
    },
    include: {
      products: true
    }
  });
  if(['purchase', 'sale'].includes(buySell.type_doc)) {
    if(buySell.type == 'sell') {
      const client = await prisma.clients.findUnique({
        where: {
          id: buySell.client_id
        }
      })

      const debitSum = parseFloat( client.debit) - parseFloat( buySell.sum);
      const clientData = {
        debit: debitSum
      }
      await prisma.clients.update({ data: clientData, where: { id: buySell.client_id } });
    }

    if(buySell.type == 'buy') {
      const supplier = await prisma.suppliers.findUnique({
        where: {
          id: buySell.supplier_id
        },
      })

      const debitSum = parseFloat( supplier.credit) -  parseFloat( buySell.sum);
      const supplierData = {
        credit: debitSum
      }
      await prisma.suppliers.update({ data: supplierData, where: { id: buySell.supplier_id } });
    }

    //--- adjust storehouse balances
    const createProductLeftoverPromises = buySell.products.map(async (product) => {
      const p = await prisma.products_leftover.findUnique({
        where: {
          product_id_storehouse_id: {
            product_id: product.product_id,
            storehouse_id: buySell.storehouse_id
          }
        },
      })

      if(p) {
        let tSum = 0, tQnt = 0;
        if(buySell.type == 'sell') {
          tSum = parseFloat( p.price ) + parseFloat( product.sum );
          tQnt = Number( p.qnt ) +  Number( product.qnt );
        }
        if(buySell.type == 'buy') {
          tSum = parseFloat( p.price ) - parseFloat( product.sum );
          tQnt = Number( p.qnt ) -  Number( product.qnt );
        }

        return await prisma.products_leftover.update({ data: { price: tSum, qnt: tQnt }, where: { id: p.id } });
      }
    })
    await Promise.all(createProductLeftoverPromises)
    //---
  }

  await prisma.buy_sell.delete({ where: { id: Number(req.params.id) } })
    .then(() => res.json({ status: "OK", message: "Succes" }))
    .catch(err => res.json({ status: "error", message: err.message }));
});


router.get("/auxiliary/data", async (req, res) => {
  const query = req.query;
  const onlyForAuthUser = { where: { id_user: req.token.id } };

  let docType = [];

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
    docType = [{name: 'Продажа', id: 'sale'}, {name: 'Заказ', id: 'order'}];
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
    data.types_doc = docType
    data.clients = client
    data.sellers = seller
    data.couriers = courier
  }

  if(query.type === 'buy') {
    docType = [{name: 'Закупка', id: 'purchase'}, {name: 'Заказ поставщику', id: 'order'}];
    const supplier = await prisma.suppliers.findMany(onlyForAuthUser);
    data.types_doc = docType
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