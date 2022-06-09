const express = require("express");
const router = express.Router();

const itemsController = require("../../controllers/items/items-controller");
const prisma = require("../../database/database");
const crypto = require("crypto");

function stringHash(string) {
  return crypto.createHash("sha1").update(Buffer.from(string, "binary")).digest().toString("hex");
}

router.get("/:id", (req, res) => {

  prisma.user_settings.findUnique({
    where: {
      id: Number(req.token.id)
    }
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
  const { password, password_confirmation } = req.body;
  const dateMs = String(Date.now());
  const data = req.body;
  data.updated_at = dateMs;
  delete data.password;
  delete data.password_confirmation;

  try {
    await prisma.user_settings.upsert({
      where: {
        id: Number(req.params.id)
      },
      update: data,
      create: {
        ...data,
        id_user: Number(req.token.id),
        created_at: dateMs
      },
    })
    if(password) {
      if(password === password_confirmation) {
        const newPasswordData = {
          pass: stringHash(password),
          updated_at: dateMs
        }
        await prisma.user.update({ data: newPasswordData, where: { id: Number(req.token.id) } });
        res.json({ status: "OK", message: "Success" });
      } else {
        res.json({ status: "error", message: 'Password confirmation not matches' });
      }
    } else {
      res.json({ status: "OK", message: "Success" });
    }
  } catch (e) {
    res.json({ status: "error", message: e.message });
  }
});

router.get("/auxiliary/data", async (req, res) => {

  const onlyForAuthUser = { where: { id_user: req.token.id } };

  const legalEntity = await prisma.legal_entites.findMany(onlyForAuthUser);
  const storehouse = await prisma.storehouse.findMany(onlyForAuthUser);
  const currency = await prisma.currency.findMany(onlyForAuthUser);

  const data = {
    legal_entites: legalEntity,
    storehouses: storehouse,
    currencies: currency
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