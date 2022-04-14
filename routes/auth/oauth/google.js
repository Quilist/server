const express = require("express");

const router = express.Router();
const utils = require("../../../controllers/utils");

const passport = require("../../../passport-setup");
const config = require("../../../config.json");

const prisma = require("../../../database/database");

const oAuthCallback = async (req, res) => {
    /*
     * Колбэк для гугла.
     *
     * Вызывается при выборе пользователем аккаунта,
     * если аккаунт существует, и почта соц сети совпадает с почтой аккаунта
     * то вход подтверждается, а информация о гугл аккаунте обновляется.
     *
     * В случае если аккаунт не был найден - создается новый аккаунт,
     * гугл информация заполняется сразу при создании аккаунта,
     * по завершению операции вход подтверждается.
     */
    const email = req.user._json.email;

    if (!email) {
        return res.json({ status: "error", message: "Google email not found." });
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
                        google: req.user.raw,
                        created_at: dateMs,
                        updated_at: dateMs
                    }
                })
                    .then(res => {
                        const authToken = utils.authToken(email, req.ip, result.id);

                        res.cookie("token", authToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, domain: "b-fin.tech" });
                        res.redirect(`${config.SiteLink}/dashboard`);;
                    })
                    .catch(err => res.json({ status: "error", message: err.message }));
            } else {
                if (result[0].pass !== password) return res.json({ status: "error", message: "Nav.Authn, LoginError" });

                if (!result[0].google) await prisma.user.update({ data: { google: req.user.raw, updated_at: String(Date.now()) }, where: { e_mail: email } })

                const authToken = utils.authToken(email, req.ip, result[0].id);

                res.cookie("token", authToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, domain: "b-fin.tech" });
                res.redirect(`${config.SiteLink}/dashboard`);
            }
        })
        .catch(err => res.json({ status: "error", message: err.message }));
}

/*
 * Роуты.
 *
 * /auth/google - авторизация через гугл аккаунт.
 * /auth/google/callback - колбэк для гугла, вызывает по выбору аккаунта пользователем.
 */

router.get("/", passport.authenticate("google", { scope: ["email"] }));
router.get("/callback", passport.authenticate("google"), oAuthCallback);

module.exports = router;