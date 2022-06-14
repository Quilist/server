const Merchant = require('privatbank-api');
const fetch = require('node-fetch');
const dateAndTime = require('date-and-time');

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

    const date = dateAndTime.format(new Date(), "DD-MM-YYYY")

    const balanceResponse = await fetch(`https://acp.privatbank.ua/api/statements/balance?startDate=${date}&limit=500`, headers);
    const resultBalance = await balanceResponse.json();

    const balances = resultBalance.balances.filter(elem => elem.balanceIn !== '0.00');

    return { balances: balances }
}


async function entityTransation(id, token, acc, date) {
    const headers = {
        'headers': {
            'id': id,
            'token': token,
            'Content-type': 'application/json;charset=utf8'
        }
    }

    const transationsResponse = await fetch(`https://acp.privatbank.ua/api/statements/transactions?acc=${acc}&startDate=${date}&limit=500`, headers);
    const resultTransations = await transationsResponse.json();

    return resultTransations;
}

module.exports = {
    individualInfo,
    individualTransations,
    entityInfo,
    entityTransation
}

{/* <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 172 172" style=" fill:#26e07f;"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,172v-172h172v172z" fill="none"></path><g fill="#1fb141"><path d="M21.5,21.5v129h64.5v-32.25v-64.5v-32.25zM86,53.75c0,17.7805 14.4695,32.25 32.25,32.25c17.7805,0 32.25,-14.4695 32.25,-32.25c0,-17.7805 -14.4695,-32.25 -32.25,-32.25c-17.7805,0 -32.25,14.4695 -32.25,32.25zM118.25,86c-17.7805,0 -32.25,14.4695 -32.25,32.25c0,17.7805 14.4695,32.25 32.25,32.25c17.7805,0 32.25,-14.4695 32.25,-32.25c0,-17.7805 -14.4695,-32.25 -32.25,-32.25z"></path></g></g></svg> */}