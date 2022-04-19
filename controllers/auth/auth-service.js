const gmail_send = require("gmail-send");

const config = require("../../config.json");
const prisma = require("../../database/database");
const utils = require("../utils");

const ApiError = require("../../exceptions/error");

class UserService {
    async registration(username, email, password) {
        const data = await prisma.user.findUnique({ where: { e_mail: email } });

        if (data) {
            throw ApiError.badRequest("Nav.Registration, EmailRegistered");
        }

        const code = utils.verificationCode(username, email, password);

        gmail_send({
            user: config.Gmail.email,
            pass: config.Gmail.password,
            to: email,
            subject: "B-fin account activation code."
        })({ text: `https://${config.ServerDomain}/auth/activation?code=${code}` }, (err, result, fullResult) => {
            if (err) throw ApiError.badRequest(err.message);

            return result;
        });
    }

    async login(email, password, ip) {
        if (!email || !password) throw ApiError.badRequest("Nav.Authn, ValidationError");

        const data = await prisma.user.findUnique({ where: { e_mail: email } })
        // если найдена запись то логинимся как админ
        if (data) {
            if (data?.pass !== utils.stringHash(password)) {
                throw ApiError.badRequest("Nav.Authn, LoginError");
            }

            return utils.authToken(email, ip, data[0].id, "Админ");
        } else { // Иначе ищем запись в сотрудниках
            const employee = await prisma.employees.findUnique({ where: { mail: email } })

            if (employee?.password !== utils.stringHash(password)) {
                throw ApiError.badRequest("Nav.Authn, LoginError");
            }

            return utils.authToken(mail, ip, data[0].id, employee.id_role);
        }
    }

    async activation(code, ip) {
        code = utils.validateObjectSign(code);
        // Проверка на валидность кода
        if (!code) throw ApiError.badRequest("Nav.Profile, InvalidCode");

        const { username, email, password, exp } = code;
        // Проверка на то, не истек ли срок годности кода
        if (exp < Date.now()) throw ApiError.badRequest("Nav.Profile, TimeoutError");

        const user = await prisma.user.findUnique({ where: { e_mail: email } });

        if (user) throw ApiError.badRequest("Nav.Registration, EmailRegistered");

        const dateMs = String(Date.now());

        const data = await prisma.user.create({
            data: {
                username: username,
                e_mail: email,
                pass: password,
                created_at: dateMs,
                updated_at: dateMs
            }
        });

        return utils.authToken(email, ip, data.id)
    }

    async restoration(email) {
        if (!email) throw ApiError.badRequest("Nav.Restore, ValidationError");

        const user = await prisma.user.findUnique({ where: { e_mail: email } })

        if (!user) throw ApiError.badRequest("Nav.Registration, EmailNotRegistered");

        //Создание кода для восстановления.
        const code = utils.objectSign({ email: email, exp: Date.now() + 3600000 });

        // Отправка кода восстановления
        send({
            user: config.Gmail.email,
            pass: config.Gmail.password,
            to: email,
            subject: "B-fin restoration code",
        })({
            text: `${config.SiteLink}/password-recovery?code=${code}`
        }, (error, result, fullResult) => {
            if (error) throw ApiError.badRequest(err.message);

            return result;
        });
    }

    async changePassword(password, code) {
        code = utils.validateObjectSign(code);
        // Проверка на валидность кода
        if (!code) throw ApiError.badRequest("Nav.Profile, InvalidCode");

        const { email, exp } = code;

        if (exp < Date.now()) throw ApiError.badRequest("Nav.Profile, TimeoutError");

        password = utils.stringHash(password);

        const user = await prisma.user.findUnique({ where: { e_mail: email } });
        if (!user || !user.pass === password) throw ApiError.badRequest("Nav.Profile, InvalidPassword");

        return await prisma.user.update({ where: { e_mail: email }, data: { pass: password } });
    }
}

module.exports = new UserService();