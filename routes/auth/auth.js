const ExpressBrute = require("express-brute");
const db = require("../../db/database")

const express = require("express");

const router = express.Router();
const send = require("gmail-send");
const utils = require("../utils");
const config = require("../../config.json");
const query = require("../../db/dbRequests");

//Создание простой защиты от брутфорса
const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store);

// Логин
router.post("/login", bruteforce.prevent, (req, res) => {
    let { email, password } = req.body;

    if (!req.body.email || !req.body.password) {
        return res.json({ status: "error", message: "Nav.Authn, ValidationError" })
    }

    password = utils.stringHash(password);

    db.query(query.GetUserByEmail, [email], (err, result) => {
        if (err) {
            return res.json({ status: "error", message: err.message });
        }

        if (result.length === 0 || result[0].pass !== password) {
            return res.json({ status: "error", message: "Nav.Authn, LoginError" });
        }

        const authToken = utils.authToken(email, req.ip, result[0].id);
        res.cookie("token", authToken, { httpOnly: false, domain: "b-fin.tech" });

        res.json({ status: "OK", message: "Successful authentication" });
    });
});

// Регистрация
router.post("/registration", (req, res) => {
    let { username, email, password } = req.body;

    // Перепроверка данных
    if (
        !password?.length > 6 ||
        !password?.match(/[a-z]/g) ||
        !password?.match(/[A-Z]/g) ||
        !password?.match(/[0-9]/g) ||
        username?.length === 0 ||
        email?.length === 0 ||
        email?.indexOf("@") === -1
    ) {
        return res.json({ status: "error", message: "Nav.Registration, ValidationError" });
    }

    db.query(query.GetUserByEmail, [email], (err, result) => {
        if (err) {
            return res.json({ status: "error", message: "Nav.Registration, InfoMessage" });
        }

        if (result.length !== 0) {
            return res.json({ status: "error", message: "Nav.Registration, EmailRegistered" });
        }

        const code = utils.verificationCode(username, email, password);

        // Отправка кода активации
        send({
            user: config.Gmail.email,
            pass: config.Gmail.password,
            to: email,
            subject: "B-fin account activation code."
        })({
            text: `https://${config.ServerDomain}/auth/activation?code=${code}`
        }, (err, result, fullResult) => {
            if (err) {
                return res.json({ status: "error", message: `https://${config.ServerDomain}/auth/activation?code=${code}` });
            }

            res.json({ status: "OK", message: "Nav.Registration, EmailSent" });
        });
    });
});

// Активация аккаунта
router.get("/activation", (req, res) => {
    /*
     * Настоящая регистрация аккаунта,
     * ведется повторная проверка на существование аккаунта в базе данных,
     * если его нет - аккаунт регистрируется,
     * т.к. пользователь уже перешел по ссылке отправленной ему на почту -
     * можно считать почту подтвержденной.
     * Ссылка действует час.
     */

    let code = req.query.code;

    // Проверка на наличие кода
    if (!code) {
        // return res.json({ status: "error", message: "Nav.Profile, ConfirmError" });
        return res.redirect(`${config.SiteLink}/error-auth`);
    }

    code = utils.validateObjectSign(code);

    // Проверка на валидность кода
    if (!code) {
        // return res.json({ status: "error", message: "Nav.Profile, InvalidCode" });
        return res.redirect(`${config.SiteLink}/error-auth`);
    }

    let { username, email, password, exp } = code;

    // Проверка на то, не истек ли срок годности кода
    if (exp < Date.now()) {
        // return res.json({ status: "error", message: "Nav.Profile, TimeoutError" });
        return res.redirect(`${config.SiteLink}/error-auth`);

    }

    db.query(query.GetUserByEmail, [email], (err, result) => {
        if (err) {
            // return res.json({ status: "error", message: err.message });
            return res.redirect(`${config.SiteLink}/error-auth`);
        }

        if (result.length !== 0) {
            // return res.json({ status: "error", message: "Nav.Registration, EmailRegistered" });
            return res.redirect(`${config.SiteLink}/error-auth`);
        }

        db.query(query.AddUser, [username, email, password, undefined, undefined], (err, result) => {
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
    });
});

// Восстановление пароля
router.get("/restoration", (req, res) => {
    const email = req.query.email

    if (!email) {
        return res.json({ status: "error", message: "Nav.Restore, ValidationError" });
    }

    db.query(query.GetUserByEmail, [email], (err, result) => {
        if (err) {
            return res.json({ status: "error", message: err.message });
        }

        if (result.length === 0) {
            return res.json({ status: "error", message: "Nav.Registration, EmailNotRegistered" });
        }

        const code = utils.restorationCode(email);

        // Отправка кода восстановления
        send({
            user: config.Gmail.email,
            pass: config.Gmail.password,
            to: email,
            subject: "B-fin restoration code",
        })({
            text: `${config.SiteLink}/password-recovery?code=${code}`
        }, (error, result, fullResult) => {
            if (error) {
                return res.json({ status: "error", message: "Nav.Registration, InfoMessage" });
            }

            res.json({ status: "OK", message: "Nav.Registration, EmailSent" });
        });
    });
});

// Смена пароля
router.post("/change-password", async (req, res) => {
    let { password, code } = req.body;

    if (!code) {
        return res.json({ status: "error", message: "Nav.Profile, ConfirmError" });
    }

    code = utils.validateObjectSign(code);

    if (!code) {
        return res.json({ status: "error", message: "Nav.Profile, InvalidCode" });
    }

    let { email, exp } = code;

    if (exp < Date.now()) {
        return res.json({ status: "error", message: "Nav.Profile, TimeoutError" });
    }

    if (
        !password?.length > 6 ||
        !password?.match(/[a-z]/g) ||
        !password?.match(/[A-Z]/g) ||
        !password?.match(/[0-9]/g)
    ) {
        return res.json({ status: "error", message: "Nav.Registration, ValidationError" });
    }

    password = utils.stringHash(password);

    db.query(query.GetUserByEmail, [email], (err, result) => {
        if (err) {
            return res.json({ status: "error", message: err.message });
        }

        if (result[0]?.pass === password) {
            return res.json({ status: "error", message: "Nav.Profile, InvalidPassword" })
        }

        db.query(query.UpdateUserPassword, [password, email], (err, result) => {
            if (err) {
                return res.json({ status: "error", message: err.message });
            }

            res.json({ status: "OK", message: "Nav.RestoreForm, ChangePassword" });
        });
    });
});

module.exports = router;
