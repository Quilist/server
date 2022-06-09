const express = require("express");
const router = express.Router();

const itemsController = require("../../controllers/items/items-controller");
const prisma = require("../../database/database");

router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    const data = await prisma.cash_accounts_users.findMany({
      skip: limit * (page - 1),
      take: limit,
      where: { id_user: req.token.id },
      include: {
        cash_account: {
          include: {
            cash_accounts_balance: true,
          }
        }
      }
    });

    const total = await prisma.cash_accounts_users.count({ where: { id_user: req.token.id } });

    return res.json({
      status: "OK", message: {
        items: data,
        paginations: {
          total: total,
          last_page: total <= limit ? 1 : total / limit
        }
      }
    })
  } catch (e) {
    next(e)
  }
});

router.post("/:id/edit", itemsController.edit);
router.post("/add", itemsController.add);
router.post("/:id/remove", itemsController.delete);
router.get("/:id", itemsController.id);

module.exports = router;
