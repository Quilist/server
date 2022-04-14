const express = require("express");

const router = express.Router();
const utils = require("../../../controllers/utils");

const passport = require("../../../passport-setup");
const config = require("../../../config.json");

const prisma = require("../../../database/database");

const oAuthCallback = async (req, res) => {
    /*
     * Колбэк для фейсбука.
     *
     * Вызывается при выборе пользователем аккаунта,
     * если аккаунт существует, и почта соц сети совпадает с почтой аккаунта
     * то вход подтверждается, а информация о фейсбук аккаунте обновляется.
     *
     * В случае если аккаунт не был найден - создается новый аккаунт,
     * фейсбук информация щаполняется сразу при создании аккаунта,
     * по завершению операции вход подтверждается.
     */

    const email = req.user._json.email;

    if (!email) {
        return res.json({ status: "error", message: "Facebook email not found." });
    }

    const password = utils.stringHash(email);

    prisma.user.findMany({ where: { e_mail: email } })
        .then(async result => {

            if (!result.length) {

                const dateMs = String(Date.now());

                prisma.user.create({
                    data: {
                        e_mail: email,
                        pass: password,
                        facebook: req.user.raw,
                        created_at: dateMs,
                        updated_at: dateMs
                    }
                })
                    .then(res => {
                        const authToken = utils.authToken(email, req.ip, result.id);

                        res.cookie("token", authToken, { httpOnly: false, domain: "b-fin.tech" });
                        res.redirect(`${config.SiteLink}/dashboard`);
                    })
                    .catch(err => res.json({ status: "error", message: err.message }));
            } else {
                if (result[0].pass !== password) return res.json({ status: "error", message: "Nav.Authn, LoginError" });

                if (!result[0].facebook) await prisma.user.update({ data: { facebook: req.user.raw, updated_at: String(Date.now()) }, where: { e_mail: email } });

                const authToken = utils.authToken(email, req.ip, result[0].id);

                res.cookie("token", authToken, { httpOnly: false, domain: "b-fin.tech" });
                res.redirect(`${config.SiteLink}/dashboard`);
            }
        })
        .catch(err => res.json({ status: "error", message: err.message }));
}

/*
 * Роуты.
 *
 * /auth/facebook - авторизация через фейсбук аккаунт.
 * /auth/facebook/callback - колбэк для фейсбука, вызывает по выбору аккаунта пользователем.
 */

router.get("/", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/callback", passport.authenticate("facebook"), oAuthCallback);

module.exports = router;
