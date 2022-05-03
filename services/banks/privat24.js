const Merchant = require('privatbank-api');
const fetch = require('node-fetch');

const config = require("../../config.json");

const merchant = new Merchant({
    id: config.privat24.id,
    password: config.privat24.password,
    country: 'UA'
});

async function individualInfo(card) {
    const res = await merchant.balance(card);
    const object = JSON.parse(res);

    return object.response.data.info.cardbalance;
}

async function entityInfo(id, token) {
    const response = await fetch("https://acp.privatbank.ua/api/statements/balance/final?limit=1000", {
        headers: {
            'id': id,
            'token': token,
            'Content-type': 'application/json;charset=utf8'
        }
    });

    const result = await response.json();
    console.log(result)
    const array = result.balances.filter(elem => elem.balanceIn !== '0.00')

    return array;
}

module.exports = {
    individualInfo,
    entityInfo
}
