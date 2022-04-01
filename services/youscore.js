const fetch = require("node-fetch");
const config = require("../config.json")

API = "https://api.youscore.com.ua/v1";

async function request(method, path, body) {
    const response = await fetch(API + path + `?apiKey=${config.apiKey}`, {
        method: method,
        body: JSON.stringify(body)
    })

    if (response.status !== 200) return undefined;
    
    return await response.json();
}

async function vat(contractorCode) {
    return await request("GET", `/vat/${contractorCode}`)
}

async function companyInfo(contractorCode) {
    return await request("GET", `/companyInfo/${contractorCode}`)
}

module.exports = {
    vat,
    companyInfo
}