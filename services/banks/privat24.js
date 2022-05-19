const Merchant = require('privatbank-api');
const fetch = require('node-fetch');

async function individualInfo(card, id, pass, date) {
    const merchant = new Merchant({ id: id, password: pass, country: 'UA' });

    const balance = await merchant.balance(card);
    const extract = await merchant.statement(card, date.first, date.second);

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