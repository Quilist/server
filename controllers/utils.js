const crypto = require("crypto");

const config = require("../config.json");
const apiError = require("../exceptions/error");

// KEY - бинарное представление ключа из конфига.

const KEY = Buffer.from(config.key, "binary");

function stringHash(string) {
    /*
     * Хэш строки.
     *
     * Строка обрабатывается алгоритмом sha1,
     * возвращается хэш представление полученых байтов.
     */
    return crypto.createHash("sha1").update(Buffer.from(string, "binary")).digest().toString("hex");
}

function objectSign(object) {
    /*
     * Подписывание обьекта.
     *
     * Создается мак с алгоритмом sha1 и ключем с конфига,
     * все элементы полученного обьекта обрабатываются маком,
     * по завершению подпись уходит в конец обьекта,
     * полученные данные возвращаются ввиде base64 строки.
     */
    const mac = crypto.createHmac("sha1", KEY);

    for (const key in object) {
        mac.update(Buffer.from(JSON.stringify(object[key])));
    }

    object.signature = mac.digest().toString("hex")
    return Buffer.from(JSON.stringify(object)).toString("base64");
}

function validateObjectSign(encodedObject) {
    /*
     * Проверка подлинности обьекта.
     *
     * Воспроизводит переподписывание обьекта,
     * и сравнивает результат с ключем который находится в конце,
     * по завершению операции возвращается обьект прошел проверку,
     * если же это не так - возвращается undefined.
     */
    try {
        const mac = crypto.createHmac("sha1", KEY);
        const string = Buffer.from(encodedObject, "base64").toString("utf-8");

        const object = JSON.parse(string);
        const sign = object.signature
        delete object.signature

        for (const key in object) {
            mac.update(Buffer.from(JSON.stringify(object[key])));
        }

        if (sign === mac.digest().toString("hex")) return object;
    } catch (e) {
        return undefined;
    }
}

function authToken(email, ip, id) {
    /*
     * Создание токена.
     */
    return objectSign({
        email: email,
        ip: ip,
        id: id,
        exp: Date.now() + 43200000
    });
}

function verificationCode(username, email, password) {
    /*
     * Создание кода для верификации.
     */
    return objectSign({
        email: email,
        username: username,
        password: stringHash(password),
        exp: Date.now() + 3600000
    });
}

function restorationCode(email) {
    /*
     * Создание кода для восстановления.
     */
    return objectSign({
        email: email,
        exp: Date.now() + 3600000
    });
}

function isTokenValid(req, res, next) {
    /*
     * Валидация токена, и его добавление в запрос 
     * для дальнейшего более удобного использования.
     */
    const token = validateObjectSign(req.cookies.token);

    if (!token) {
        return res.json({ status: "error", message: "Invalid session" });
    }

    const tokenKeys = Object.keys(token);
    const validateKeys = ["email", "id", "ip", "exp"];

    for (const key in validateKeys) {
        if (!tokenKeys[key]) {
            return res.json({ status: "error", message: "Invalid session" });
        }
    }

    req.token = token;
    next();
}

module.exports = {
    stringHash,
    authToken,
    verificationCode,
    restorationCode,
    validateObjectSign,
    isTokenValid
}
