const fs = require("fs");

const express = require("express");
const router = express.Router();

const youscore = require("../services/youscore");
const utils = require("../controllers/utils");

const authRouter = require("./auth/auth");
const googleAuthRouter = require("./auth/oauth/google");
const facebookAuthRouter = require("./auth/oauth/facebook");

const clientsRouter = require("./clients/clients");
const payRouter = require("./pay/pay");

const cashAccountRouter = require("./directory/cash_and_accounts");
const moneyRouter = require("./money/money");
const productRouter = require("./product/product");
/*
 * Роуты.
 *
 * Указаны все роуты для api.
 */

router.get("/edrpou-info/:edrpou", utils.isTokenValid, async (req, res) => {
    const vat = await youscore.vat(req.params.edrpou);
    const info = await youscore.companyInfo(req.params.edrpou);

    if (!vat.length || vat?.code === "InvalidParameters") return res.json({ status: "error", message: "invalid ? edrpou" });

    res.json({
        status: "OK", message: {
            code_nds: vat.code,
            company: info.shortName,
            director: info.director,
            name: info.name
        }
    });
});

router.use("/auth", authRouter);
router.use("/auth/google", googleAuthRouter);
router.use("/auth/facebook", facebookAuthRouter);

router.use(utils.isTokenValid);

router.use("/clients", clientsRouter);
router.use("/pay", payRouter);

fs.readdir('./routes/directory', (err, files) => {
    files.forEach(elem => {
        router.use(`/${elem.substring(0, elem.length - 3)}`, require(`${__dirname}/directory/${elem}`));
    });
});

router.use("/cash_accounts", cashAccountRouter);
router.use("/money", moneyRouter);
router.use("/products", productRouter);

module.exports = router;