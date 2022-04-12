const authService = require("./auth-service");
const config = require("../../config.json");
const { passwordStrength } = require('check-password-strength');

class authController {
    // регистрация
    async registration(req, res, next) {
        try {
            const { username, email, password } = req.body;

            if (passwordStrength(password).value !== "Strong" && email?.indexOf("@") === -1) {
                return res.json({ status: "error", message: "Nav.Registration, ValidationError" });
            }

            await authService.registration(username, email, password);

            return res.json({ status: "OK", message: "Nav.Registration, EmailSent" });
        } catch (e) {
            next(e);
        }
    }
    // логин
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const data = await authService.login(email, password, req.ip);

            res.cookie("token", data, { httpOnly: false, domain: "b-fin.tech" });
            return res.redirect(`${config.SiteLink}/dashboard`);
        } catch (e) {
            next(e);
        }
    }
    // активация аккаунта
    async activation(req, res, next) {
        /*
         * Настоящая регистрация аккаунта,
         * ведется повторная проверка на существование аккаунта в базе данных,
         * если его нет - аккаунт регистрируется,
         * т.к. пользователь уже перешел по ссылке отправленной ему на почту -
         * можно считать почту подтвержденной.
         * Ссылка действует час.
         */
        try {
            const data = await authService.activation(req.query.code, req.ip);

            res.cookie("token", data, { httpOnly: false, domain: "b-fin.tech" })
            return res.redirect(`${config.SiteLink}/dashboard`);
        } catch (e) {
            next(e);
        }
    }
    // восстановление пароля
    async restoration(req, res, next) {
        try {
            await authService.restoration(req.query.email);

            return res.json({ status: "OK", message: "Nav.Registration, EmailSent" });
        } catch (e) {
            next(e);
        }
    }
    // смена пароля
    async changePassword(req, res, next) {
        try {
            const { password, code } = req.body;

            if (passwordStrength(password).value !== "Strong") {
                return res.json({ status: "error", message: "Nav.Registration, ValidationError" });
            }

            await authService.changePassword(password, code);

            return res.json({ status: "OK", message: "Nav.RestoreForm, ChangePassword" });
        } catch (e) {
            next(e);
        }
    }
    // выход
    async logout(req, res, next) {
        try {
            return res.clearCookie("token").redirect(`${config.SiteLink}/`);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new authController();