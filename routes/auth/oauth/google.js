const express = require("express");

const router = express.Router();
const utils = require("../../utils");

const config = require("../../../config.json");
const db = require("../../../database");
const passport = require("../../../passport-setup");
const query = require("../../../dbRequests");

const oAuthCallback = (req, res) => {
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

    db.query(query.GetUserByEmail, [email], (err, result) => {
        if (err) {
            return res.json({ status: "error", message: err.message });
        }

        if (result.length === 0) {
            db.query(query.AddUser, [email.split("@")[0], email, password, req.user.raw, undefined], (err, result) => {
                if (err) {
                    return res.json({ status: "error", message: err.message });
                }

                db.query(query.GetUserByEmail, [email], (err, result) => {
                    if (err) {
                        // return res.json({ status: "error", message: err.message });
                        return res.redirect(`${config.SiteLink}/error-auth`);
                    }
    
                    const authToken = utils.authToken(email, req.ip, result[0].id);
                    res.cookie("token", authToken, { httpOnly: false, domain: "b-fin.tech" });
    
                    res.redirect(`${config.SiteLink}/dashboard`);    
                });
            });
            return;
        }

        if (result[0].pass === password) {
            if (!result[0].google) {
                db.query(query.UpdateUserGoogleAccount, [req.user.raw, email], (err, result) => {
                    if (err) return res.json({ status: "error", message: err.message });
                });
            }

            const authToken = utils.authToken(email, req.ip, result[0].id);
            res.cookie("token", authToken, { httpOnly: false, domain: "b-fin.tech" });

            res.redirect(`${config.SiteLink}/dashboard`);
        } else {
            res.json({ status: "error", message: "Nav.Authn, LoginError" });
        }
    });
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