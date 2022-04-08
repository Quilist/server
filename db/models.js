const sequelize = require("./database");
const { Sequelize, Model } = require('sequelize');

class AllCurrencies extends Model { }
class BanksDetails extends Model { }
class CashAccountsBalance extends Model { }
class CashAndAccounts extends Model { }
class Clients extends Model { }
class CurrencyExchange extends Model { }
class Employees extends Model { }
class Expenditure extends Model { }
class IncomeItems extends Model { }
class LegalEntites extends Model { }
class Measure extends Model { }
class MovingMoney extends Model { }
class Pay extends Model { }
class PayType extends Model { }
class StoreHouse extends Model { }
class Suppliers extends Model { }
class TypePrice extends Model { }
class User extends Model { }
class UserCurrencies extends Model { }

const configuration = (elem) => { return { sequelize, modelName: elem, timestamps: false, freezeTableName: true } }

const { STRING, NUMBER, NULL, JSON } = Sequelize;

const id = {
    type: NUMBER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
}

const id_user = { type: NUMBER, allowNull: false }

AllCurrencies.init({
    id, name: {
        type: STRING,
        defaultValue: NULL
    },
    represent: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("all_currencies"));

BanksDetails.init({
    id, id_user,
    bank_name: {
        type: STRING,
        defaultValue: NULL,
    },
    MFO: {
        type: STRING,
        defaultValue: NULL
    },
    checking_account: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("bank_details"));

CashAccountsBalance.init({
    id, cash_account_id: {
        type: NUMBER,
        allowNull: false
    },
    currency_id: {
        type: NUMBER,
        allowNull: false
    },
    balance: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: NULL
    }
}, configuration("cash_accounts_balance"));

CashAndAccounts.init({
    id, id_user,
    id_type_order: {
        type: NUMBER,
        defaultValue: NULL
    },
    name: {
        type: STRING,
        defaultValue: NULL
    },
    id_user_currencies: {
        type: NUMBER,
        defaultValue: NULL
    },
    id_bank_details: {
        type: NUMBER,
        defaultValue: NULL
    },
    balanceIn: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: NULL
    },
    turnoverDebt: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: NULL
    },
    turnoverCred: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: NULL
    },
    type: {
        type: STRING,
        defaultValue: NULL
    },
    stream: {
        type: JSON,
        defaultValue: NULL
    }
}, configuration("cash_and_accounts"));

Clients.init({
    id, id_user,
    name: {
        type: STRING,
        defaultValue: NULL
    },
    mobile: {
        type: STRING,
        defaultValue: NULL
    },
    company: {
        type: STRING,
        defaultValue: NULL
    },
    mail: {
        type: STRING,
        defaultValue: NULL
    },
    id_group: {
        type: NUMBER,
        defaultValue: NULL
    },
    address: {
        type: STRING,
        defaultValue: NULL
    },
    notes: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("clients"));

CurrencyExchange.init({
    id, id_user,
    date_create: {
        type: STRING,
        defaultValue: NULL
    },
    from_currency_id: {
        type: NUMBER,
        allowNull: false
    },
    to_currency_id: {
        type: NUMBER,
        allowNull: false
    },
    exchange_rate: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: NULL
    },
    cash_account_id: {
        type: NUMBER,
        allowNull: false
    },
    amount_pay: {
        type: STRING,
        defaultValue: NULL
    },
    amount_receive: {
        type: STRING,
        defaultValue: NULL
    },
    note: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("currency_exchange"));

Employees.init({
    id, id_user,
    f_name: {
        type: STRING,
        defaultValue: NULL
    },
    s_name: {
        type: STRING,
        defaultValue: NULL
    },
    mobile: {
        type: STRING,
        defaultValue: NULL
    },
    password: {
        type: STRING,
        allowNull: false
    },
    mail: {
        type: STRING,
        allowNull: false
    },
    id_role: {
        type: STRING,
        defaultValue: NULL
    },
    id_cach_acc: {
        type: NUMBER,
        defaultValue: NULL
    },
    dachboard: {
        type: Sequelize.TINYINT(1),
        defaultValue: "0"
    },
    suppliers: {
        type: Sequelize.TINYINT(1),
        defaultValue: "0"
    },
    cash_accounts: {
        type: Sequelize.TINYINT(1),
        defaultValue: "0"
    },
    order_supplier: {
        type: Sequelize.TEXT
    }
}, configuration("employees"));

Expenditure.init({
    id, id_user, name: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("expenditure"));

IncomeItems.init({
    id, id_user, name: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("income_items"));

LegalEntites.init({
    id, id_user,
    name: {
        type: STRING,
        allowNull: false
    },
    mail: {
        type: STRING,
        defaultValue: NULL
    },
    site: {
        type: STRING,
        defaultValue: NULL
    },
    mobile: {
        type: STRING,
        defaultValue: NULL
    },
    account: {
        type: STRING,
        defaultValue: NULL
    },
    address: {
        type: STRING,
        defaultValue: NULL
    },
    inn: {
        type: STRING,
        defaultValue: NULL
    },
    legal_name: {
        type: STRING,
        defaultValue: NULL
    },
    low_system: {
        type: STRING,
        defaultValue: NULL
    },
    director: {
        type: STRING,
        defaultValue: NULL
    },
    nds: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("legal_entites"));

Measure.init({
    id, id_user, name: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("measure"));

MovingMoney.init({
    id, id_user,
    date_create: {
        type: STRING,
        defaultValue: NULL
    },
    from_cash_account_id: {
        type: NUMBER,
        allowNull: false
    },
    to_cash_account_id: {
        type: NUMBER,
        allowNull: false,
    },
    amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: NULL
    },
    note: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("moving_money"));

Pay.init({
    id, id_user,
    number: {
        type: NUMBER,
        allowNull: false
    },
    date_create: {
        type: STRING,
        defaultValue: NULL
    },
    id_type: {
        type: NUMBER,
        defaultValue: NULL
    },
    type: {
        type: STRING,
        allowNull: false
    },
    type_order: {
        type: STRING,
        defaultValue: NULL
    },
    id_cach_accounts: {
        type: STRING,
        defaultValue: NULL
    },
    note: {
        type: STRING,
        defaultValue: NULL
    },
    id_legal_entites: {
        type: NUMBER,
        defaultValue: NULL
    }
}, configuration("pay"));

PayType.init({
    id, id_user,
    pay_id: {
        type: NUMBER,
        allowNull: false
    },
    currency_id: {
        type: NUMBER,
        allowNull: false
    },
    amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
    },
    type_pay: {
        type: STRING,
        allowNull: false
    },
    type_amount: {
        type: STRING,
        allowNull: false
    },
    date_create: {
        type: STRING,
        allowNull: false
    }
}, configuration("pay_type"));

StoreHouse.init({
    id, id_user, name: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("storehouse"));

Suppliers.init({
    id, id_user,
    name: {
        type: STRING,
        allowNull: false
    },
    mail: {
        type: STRING,
        defaultValue: NULL
    },
    mobile: {
        type: STRING,
        defaultValue: NULL
    },
    company: {
        type: STRING,
        defaultValue: NULL
    },
    edrpou: {
        type: STRING,
        defaultValue: NULL
    },
    address: {
        type: STRING,
        defaultValue: NULL
    },
    code_nds: {
        type: STRING,
        defaultValue: NULL
    },
    nds: {
        type: STRING,
        defaultValue: NULL
    },
    notes: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("suppliers"));

TypePrice.init({
    id, id_user, name: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("type_price"));

User.init({
    id,
    acc: {
        type: STRING,
        defaultValue: NULL
    },
    f_name: {
        type: STRING,
        defaultValue: NULL
    },
    s_name: {
        type: STRING,
        defaultValue: NULL
    },
    company: {
        type: STRING,
        defaultValue: NULL
    },
    e_mail: {
        type: STRING,
        defaultValue: NULL
    },
    phone: {
        type: STRING,
        defaultValue: NULL
    },
    username: {
        type: STRING,
        defaultValue: NULL
    },
    pass: {
        type: STRING,
        defaultValue: NULL
    },
    status: {
        type: NUMBER,
        defaultValue: "1",
        allowNull: false
    },
    role: {
        type: NUMBER,
        defaultValue: "1",
        allowNull: false
    },
    google: {
        type: STRING,
        defaultValue: NULL
    },
    facebook: {
        type: STRING,
        defaultValue: NULL
    },
    address: {
        type: STRING,
        defaultValue: NULL
    },
    notes: {
        type: STRING,
        defaultValue: NULL
    }
}, configuration("user"));

UserCurrencies.init({
    id, id_user,
    id_from_currencies: {
        type: NUMBER,
        allowNull: false
    },
    id_to_currecnies: {
        type: NUMBER,
        allowNull: false
    },
    exchange_rate: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
    }
}, configuration("user_currencies"));

module.exports = {
    AllCurrencies,
    BanksDetails,
    CashAccountsBalance,
    CashAndAccounts,
    Clients,
    CurrencyExchange,
    Employees,
    Expenditure,
    IncomeItems,
    LegalEntites,
    Measure,
    MovingMoney,
    Pay,
    PayType,
    StoreHouse,
    Suppliers,
    TypePrice,
    User,
    UserCurrencies
}