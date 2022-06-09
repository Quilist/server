const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");
const itemsController = require("../../controllers/items/items-controller");

// получение всех LegalEntites юрлиц
router.get("/", itemsController.all);

// добавление LegalEntites
router.post("/add", async (req, res) => {
    const request = req.body;
    const cashAccounts = req.body.cash_accounts;
    delete req.body.cash_accounts;

    if (request.name?.length < 3 || request.mobile?.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }

    const dateMs = String(Date.now());

    const data = {
        ...request,
        id_user: req.token.id,
        created_at: dateMs,
        updated_at: dateMs
    }

    try {
        //save main
        const legalEntity = await prisma.legal_entites.create({ data: data });

        if(cashAccounts?.length > 0) {
            let l = [];
            let p = {}
            cashAccounts.forEach(function(item) {
                p = {
                    ...item,
                    legal_entity_id: legalEntity.id
                };
                l.push(p)
            });

            //--- save related products
            const createLegalEntityPromises = l.map((item) => {
                return prisma.legal_entites_cash_accounts.create({
                    data: item
                })
            })
           await Promise.all(createLegalEntityPromises)
        }

        res.json({ status: "OK",
            message: "Success"})
    } catch (e) {
        console.log(e)
        throw e
    }
});

router.get("/:id", (req, res) => {

    prisma.legal_entites.findUnique({
        where: {
            id: Number(req.params.id)
        },
        include: {
            cash_accounts: true,
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

// редактирование LegalEntites
router.post("/:id/edit", async (req, res) => {
    const { mobile, name } = req.body;

    if (name?.length < 3 || mobile?.length !== 10) {
        return res.json({ status: "error", message: "incorrect name or phone" })
    }
    // отправка запроса
    prisma.legal_entites.update({ data: { ...req.body, updated_at: String(Date.now()) }, where: { id: Number(req.params.id) } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

// Удаление LegalEntites
router.post("/:id/remove", itemsController.delete);

router.get("/auxiliary/data", async (req, res) => {
    const cashAccounts = await prisma.cash_accounts.findMany(
      {
          where: {
              id_user: req.token.id,
              type_order: 'account'
          }
      }
    );

    const data = {
        cash_accounts: cashAccounts,
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