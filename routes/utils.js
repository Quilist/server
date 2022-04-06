const crypto = require("crypto");

const config = require("../config.json");
const db = require("../db/database");

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
    const mac = crypto.createHmac("sha1", KEY);
    const string = Buffer.from(encodedObject, "base64").toString("utf-8");

    try {
        const object = JSON.parse(string);
        const sign = object.signature
        delete object.signature

        for (const key in object) {
            mac.update(Buffer.from(JSON.stringify(object[key])));
        }

        if (sign === mac.digest().toString("hex")) return object
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
        return res.json({
            status: "error",
            message: "Invalid session"
        });
    }

    const tokenKeys = Object.keys(token);
    const validateKeys = ["email", "id", "ip", "exp"];

    for (const key in validateKeys) {
        if (!tokenKeys[key]) {
            return res.json({
                status: "error",
                message: "Invalid session"
            });
        }
    }

    req.token = token;
    next();
}

function paginations(req, res, dbRequest, dbParam) {
    /*
     * Отправка запроса через функцию,
     * для дальнейшего более удобного
     * использования.
     */
    db.query(dbRequest, dbParam, (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });

        const array = [...result];

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 25;
        const size = array.length < limit ? array.length : limit;

        const subarray = [];

        if (array.length !== 0) {
            for (let i = 0; i < Math.ceil(array.length / size); i++) {
                subarray.push(array.slice((i * size), (i * size) + size));
            }
        }

        res.json({
            status: "OK", message: {
                items: subarray.length !== 0 ? subarray[page - 1] : [],
                paginations: {
                    total: result.length,
                    last_page: subarray.length
                }
            }
        });
    });
}

function dbRequest(...params) {
    /*
     * Отправка запроса через функцию,
     * для дальнейшего более удобного
     * использования.
     */
    db.query(...params, (err, result) => {
        if (err) return params[0].json({ status: "error", message: err.message });

        params[0].json({ status: "OK", message: params[2] || result });
    });
}

function dbRequestFromId(res, req, dbRequest, dbParam) {
    /*
     * Отправка запроса через функцию,
     * для дальнейшего более удобного
     * использования.
     */
    db.query(dbRequest, dbParam, (err, result) => {
        if (err) return res.json({ status: "error", message: err.message });
        // проверка на пренадлежность к пользователю
        if (result[0]?.id_user !== req.token.id) return res.json({ status: "error", message: "Action not allowed" });

        res.json({ status: "OK", message: result.length !== 0 ? result[0] : [] });
    });
}

function makeQuery(...params) {
    /*
     * Отправка запроса через функцию,
     * для дальнейшего более удобного
     * использования.
     * (Эксперимент)
     */
    return new Promise((resolve, reject) => {
        db.query(...params, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
}

module.exports = {
    stringHash,
    authToken,
    verificationCode,
    validateObjectSign,
    isTokenValid,
    dbRequest,
    dbRequestFromId,
    paginations,
    makeQuery
}
