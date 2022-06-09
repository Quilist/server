const fs = require("fs");

const express = require("express");
const router = express.Router();

const youscore = require("../services/youscore");
const utils = require("../controllers/utils");

const authRouter = require("./auth/auth");
const googleAuthRouter = require("./auth/oauth/google");
const facebookAuthRouter = require("./auth/oauth/facebook");

const clientsRouter = require("./clients/clients");

const cashAccountRouter = require("./directory/cash_and_accounts");
const moneyRouter = require("./money/money");
const buySellRouter = require("./buySell/buySell");

const productRouter = require("./product/product");
const productPostingRouter = require("./product/product_posting");
const productImportRouter = require("./product/product_import");
const productMovingRouter = require("./product/product_moving");
const productWriteOffRouter = require("./product/product_write_off");

const manufactureRouter = require("./manufacture/manufacture");
const allMoveRouter = require("./allMove/allMove");

const userSettingsRouter = require("./user/settings");
const payRouter = require("./pay/pay");
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

fs.readdir('./routes/directory', (err, files) => {
    files.forEach(elem => {
        router.use(`/${elem.substring(0, elem.length - 3)}`, require(`${__dirname}/directory/${elem}`));
    });
});

router.use("/cash_accounts", cashAccountRouter);
router.use("/money", moneyRouter);
router.use("/buy_sell", buySellRouter);

router.use("/products", productRouter);
router.use("/products_posting", productPostingRouter);
router.use("/products_write_off", productWriteOffRouter);
router.use("/products_moving", productMovingRouter);
router.use("/products_import", productImportRouter);

router.use("/manufacture", manufactureRouter);
router.use("/all_moves", allMoveRouter);
router.use("/user_settings", userSettingsRouter);
router.use("/pay", payRouter);



module.exports = router;