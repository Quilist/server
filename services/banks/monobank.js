const fetch = require("node-fetch");

API = "https://api.monobank.ua";

async function userInfo(method, path, token) {
    const response = await fetch(`${API}${path}`, {
        "method": method,
        "headers": {
            "X-Token": token
        }
    });

    if (response.status !== 200) return undefined;

    return await response.json();
}

module.exports = { userInfo }