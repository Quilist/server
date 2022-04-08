const express = require("express");

const router = express.Router();
const utils = require("../../utils");

const passport = require("../../../passport-setup");
const config = require("../../../config.json");

const models = require("../../../db/models");

const oAuthCallback = (req, res) => {
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

    models.User.findOne({ where: { e_mail: email } })
        .then(result => {

            if (!result) {

                models.User.create({ e_mail: email, pass: password, facebook: req.user.raw })
                    .then(res => {
                        const authToken = utils.authToken(email, req.ip, result.dataValues.id);

                        res.cookie("token", authToken, { httpOnly: false, domain: "b-fin.tech" }).redirect(`${config.SiteLink}/dashboard`);
                    })
                    .catch(err => res.json({ status: "error", message: err.message }));

            } else {
                if (result.dataValues.pass !== password) return res.json({ status: "error", message: "Nav.Authn, LoginError" });

                if (!result.dataValues.facebook) models.User.update({ facebook: req.user.raw }, { where: { e_mail: email } })

                const authToken = utils.authToken(email, req.ip, result[0].id);

                res.cookie("token", authToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true, domain: "b-fin.tech" }).redirect(`${config.SiteLink}/dashboard`);
            }
        })
        .catch(err => res.json({ status: "error", message: err.message }))
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
