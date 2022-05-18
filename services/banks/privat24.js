const Merchant = require('privatbank-api');
const date = require('date-and-time');
const fetch = require('node-fetch');

async function individualInfo(card, id, pass) {
    const merchant = new Merchant({ id: id, password: pass, country: 'UA' });

    const dateNow = date.format(new Date(), 'DD.MM.YYYY')

    const balance = await merchant.balance(card);
    const extract = await merchant.statement(card, "01.01.1970", dateNow);

    const balanceObj = JSON.parse(balance);
    const extractObj = JSON.parse(extract);

    return {
        balance: balanceObj.response.data.info.cardbalance,
        extract: extractObj.response.data.info.statements.statement
    };
}

async function entityInfo(id, token) {
    const response = await fetch("https://acp.privatbank.ua/api/statements/balance/final?limit=1000", {
        'headers': {
            'id': id,
            'token': token,
            'Content-type': 'application/json;charset=cp1251'
        }
    });

    const result = await response.json();
    const array = result.balances.filter(elem => elem.balanceIn !== '0.00')

    return array;
}

module.exports = {
    individualInfo,
    entityInfo
}