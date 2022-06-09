const Merchant = require('privatbank-api');
const fetch = require('node-fetch');

async function individualInfo(card, id, pass) {
    const merchant = new Merchant({ id: id, password: pass, country: 'UA' });

    const balance = await merchant.balance(card);
    const balanceObj = JSON.parse(balance);

    return { balance: balanceObj?.response?.data?.info?.cardbalance };
}

async function individualTransations(card, id, pass, date) {
    const merchant = new Merchant({ id: id, password: pass, country: 'UA' });

    const extract = await merchant.statement(card, date.first, date.second)
    const extractObj = JSON.parse(extract);

    return { extract: extractObj?.response?.data?.info?.statements?.statement };
}

async function entityInfo(id, token) {
    const headers = {
        'headers': {
            'id': id,
            'token': token,
            'Content-type': 'application/json;charset=utf8'
        }
    }

    const balanceResponse = await fetch(`https://acp.privatbank.ua/api/statements/balance/final?limit=500`, headers);
    const resultBalance = await balanceResponse.json();

    const balances = resultBalance.balances.filter(elem => elem.balanceIn !== '0.00');

    return { balances: balances }
}


async function entityTransation(id, token, date) {
    const headers = {
        'headers': {
            'id': id,
            'token': token,
            'Content-type': 'application/json;charset=utf8'
        }
    }

    const transationsResponse = await fetch(`https://acp.privatbank.ua/api/statements/transactions?startDate=${date}&limit=500`, headers);
    const resultTransations = await transationsResponse.json();

    return resultTransations?.transactions
}

module.exports = {
    individualInfo,
    individualTransations,
    entityInfo,
    entityTransation
}
