const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.get("/", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

   const posting = await prisma.products_posting.findMany({
    skip: limit * (page - 1), take: limit,
    where: {
      id_user: req.token.id
    },
    include: {
      income_items: true,
      storehouse: true,
      type_price: true,
      currency: true,
      products: true,
    },
  });

  posting.map((imp, i) => {
    imp.type = 'posting';
    return imp;
  });

   const writeOff = await prisma.products_write_off.findMany({
    skip: limit * (page - 1), take: limit,
    where: {
      id_user: req.token.id
    },
    include: {
      expenditure: true,
      storehouse: true,
      products: true,
    },
  });

  writeOff.map((imp, i) => {
    imp.type = 'write_off';
    return imp;
  });

  const moving = await prisma.products_moving.findMany({
    skip: limit * (page - 1), take: limit,
    where: {
      id_user: req.token.id
    },
    include: {
      storehouse_sender: true,
      storehouse_consignee: true,
      products: true,
    },
  });

  moving.map((imp, i) => {
    imp.type = 'moving';
    return imp;
  });

  const importProd = await prisma.products_import.findMany({
    skip: limit * (page - 1), take: limit,
    where: {
      id_user: req.token.id
    },
    include: {
      income_items: true,
      storehouse: true,
      type_price: true,
      currency: true,
      products: true,
    },
  });

  importProd.map((imp, i) => {
    imp.type = 'import';
    return imp;
  });

  const data = [].concat(posting, writeOff, moving, importProd)

  const totalPosting = await prisma.products_posting.count();
  const totalWriteOff = await prisma.products_write_off.count();
  const total = totalPosting + totalWriteOff;

  Promise.all([data])
    .then(elem => {
      res.json({
        status: "OK", message: {
          items: data,
          paginations: {
            total: total,
            last_page: total <= limit ? 1 : total / limit
          }
        }
      });
    })
    .catch(({ message }) => res.json({ status: "error", message }));
});

module.exports = router;