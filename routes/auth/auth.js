const express = require("express");
const send = require("gmail-send");

const router = express.Router();

const utils = require("../utils");
const config = require("../../config.json");
const models = require("../../db/models");

//Создание простой защиты от брутфорса
const ExpressBrute = require("express-brute");

const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store);

// Логин
router.post("/login", bruteforce.prevent, (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.json({ status: "error", message: "Nav.Authn, ValidationError" });

    models.User.findOne({ where: { e_mail: email } })
        .then(result => {
            const info = result.dataValues

            if (!info || info?.pass !== utils.stringHash(password)) {
                return res.json({ status: "error", message: "Nav.Authn, LoginError" });
            }

            const authToken = utils.authToken(email, req.ip, info.id);

            res.cookie("token", authToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true, domain: "b-fin.tech" });
            res.json({ status: "OK", message: "Successful authentication" });
        })
        .catch((err) => res.json({ status: "error", message: err.message }));
});

// Регистрация
router.post("/registration", (req, res) => {
    const { username, email, password } = req.body;

    // Перепроверка данных
    if (
        !password?.length > 6 ||
        !password?.match(/[a-z]/g) ||
        !password?.match(/[A-Z]/g) ||
        !password?.match(/[0-9]/g) ||
        username?.length === 0 ||
        email?.length === 0 ||
        email?.indexOf("@") === -1
    ) return res.json({ status: "error", message: "Nav.Registration, ValidationError" });

    models.User.findOne({ where: { e_mail: email } })
        .then(result => {
            if (result) return res.json({ status: "error", message: "Nav.Registration, EmailRegistered" });

            const code = utils.verificationCode(username, email, password);

            send({
                user: config.Gmail.email,
                pass: config.Gmail.password,
                to: email,
                subject: "B-fin account activation code."
            })({
                text: `https://${config.ServerDomain}/auth/activation?code=${code}`
            }, (err, result, fullResult) => {
                if (err) return res.json({ status: "error", message: err.message });

                res.json({ status: "OK", message: "Nav.Registration, EmailSent" });
            });
        })
        .catch((err) => res.json({ status: "error", message: err.message }));
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
    if (!code) return res.json({ status: "error", message: "Nav.Profile, ConfirmError" });

    code = utils.validateObjectSign(code);

    // Проверка на валидность кода
    if (!code) return res.json({ status: "error", message: "Nav.Profile, InvalidCode" });

    const { username, email, password, exp } = code;

    // Проверка на то, не истек ли срок годности кода
    if (exp < Date.now()) return res.json({ status: "error", message: "Nav.Profile, TimeoutError" });

    models.User.findOne({ where: { e_mail: email } })
        .then(result => {
            if (result) return res.json({ status: "error", message: "Nav.Registration, EmailRegistered" });

            models.User.create({ username: username, e_mail: email, pass: password })
                .then(result => {
                    const authToken = utils.authToken(email, req.ip, result.dataValues.id);
                    res.cookie("token", authToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true, domain: "b-fin.tech" })

                    res.redirect(`${config.SiteLink}/dashboard`);
                })
                .catch((err) => res.json({ status: "error", message: err.message }));
        })
        .catch((err) => res.json({ status: "error", message: err.message }));
});

// Восстановление пароля
router.get("/restoration", (req, res) => {
    const email = req.query.email

    if (!email) return res.json({ status: "error", message: "Nav.Restore, ValidationError" });

    models.User.findOne({ where: { e_mail: email } })
        .then(result => {
            const info = result.dataValues

            if (!info) return res.json({ status: "error", message: "Nav.Registration, EmailNotRegistered" });

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
                if (error) return res.json({ status: "error", message: "Nav.Registration, InfoMessage" });

                res.json({ status: "OK", message: "Nav.Registration, EmailSent" });
            });
        })
        .catch((err) => res.json({ status: "error", message: err.message }));
});

// Смена пароля
router.post("/change-password", async (req, res) => {
    let { password, code } = req.body;

    if (!code) return res.json({ status: "error", message: "Nav.Profile, ConfirmError" });

    code = utils.validateObjectSign(code);

    if (!code) return res.json({ status: "error", message: "Nav.Profile, InvalidCode" });

    const { email, exp } = code;

    if (exp < Date.now()) return res.json({ status: "error", message: "Nav.Profile, TimeoutError" });

    if (
        !password?.length > 6 ||
        !password?.match(/[a-z]/g) ||
        !password?.match(/[A-Z]/g) ||
        !password?.match(/[0-9]/g)
    ) return res.json({ status: "error", message: "Nav.Registration, ValidationError" });

    password = utils.stringHash(password);

    models.User.findOne({ where: { e_mail: email } })
        .then(result => {
            const info = result.dataValues

            if (!info.pass === password) return res.json({ status: "error", message: "Nav.Profile, InvalidPassword" });

            models.User.update({ pass: password }, { where: { e_mail: email } })
                .then(() => res.json({ status: "OK", message: "Nav.RestoreForm, ChangePassword" }))
                .catch((err) => res.json({ status: "error", message: err.message }));
        })
        .catch((err) => res.json({ status: "error", message: err.message }));
});

module.exports = router;
