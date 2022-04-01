const Merchant = require('privatbank-api');
const fetch = require('node-fetch');

const config = require("../../config.json");

const merchant = new Merchant({
    id: config.privat24.id,
    password: config.privat24.password,
    country: 'UA'
});

async function individualInfo(card) {
    const balance = await merchant.balance(card);
    return balance;
}

async function entityInfo(id, token) {
    let response = await fetch("https://acp.privatbank.ua/api/statements/balance/final?limit=1000", {
        headers: {
            'id': id,
            'token': token,
            'Content-type': 'application/json;charset=utf8'
        }
    });

    if (response.status !== 200) return undefined;

    const arr = response.balances.filter(elem => elem.balanceIn !== '0.00')

    return arr;
}

module.exports = {
    individualInfo,
    entityInfo
}