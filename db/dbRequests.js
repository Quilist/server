// Бд запросы на удаление, получения списка, получение по айди
const getItem = (...item) => `SELECT ${item[1] || "*"} FROM ${item[0]} WHERE id = ?`;
const getItems = (...item) => `SELECT ${item[1] || "*"} FROM ${item[0]} WHERE id_user = ?`;
const removeItem = item => `DELETE FROM ${item} WHERE id = ?`;

// БД запросы к user
const GetUserByEmail = "SELECT * FROM user WHERE e_mail = ?";
const UpdateUserPassword = "UPDATE user SET pass = ? WHERE e_mail = ?";
const UpdateUserGoogleAccount = "UPDATE user SET google = ? WHERE e_mail = ?";
const UpdateUserFacebookAccount = "UPDATE user SET facebook = ? WHERE email = ?";
const AddUser = "INSERT INTO user (username, e_mail, pass, google, facebook) VALUES (?, ?, ?, ?, ?)";

// БД запросы к clients
const GetAllGroupClients = "SELECT * FROM clients WHERE id_group = ?"
const AddClient = "INSERT INTO clients (id_user, name, mobile, company, mail, id_group, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
const UpdateClient = "UPDATE clients SET name = ?, mobile = ?, company = ?, mail = ?, address = ?, notes = ? WHERE id = ?";

// БД запросы к suppliers
const AddSupplier = "INSERT INTO suppliers (id_user, name, mobile, company, mail, edrpou, address, notes, nds, code_nds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
const UpdateSupplier = "UPDATE suppliers SET name = ?, mobile = ?, company = ?, mail = ?, edrpou = ?, address = ?, notes = ?, nds = ?, code_nds = ? WHERE id = ?";

// БД запросы к employees
const AddEmployee = "INSERT INTO employees (id_user, f_name, s_name, mobile, password, mail, id_role, id_cach_acc, dachboard, suppliers, cash_accounts, order_supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
const UpdateEmployee = "UPDATE employees SET f_name = ?, s_name = ?, mobile = ?, password = ?, mail = ?, id_role = ?, id_cach_acc = ?, dachboard = ?, suppliers = ?, cash_accounts = ?, order_supplier = ? WHERE id = ?";

// БД запросы к legalEntites
const addLegalEntites = "INSERT INTO legal_entites (id_user, name, address, mobile, account, mail, site, inn, legal_name, edrpou, low_system, nds, director) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
const editLegalEntites = "UPDATE legal_entites SET name = ?, address = ?, mobile = ?, account = ?, mail = ?, site = ?, inn = ?, legal_name = ?, edrpou = ?, low_system = ?, nds = ?, director = ? WHERE id = ?";

// БД запросы к user_currencies
const addCurrency = "INSERT INTO user_currencies (id_user, id_from_currencies, id_to_currencies, exchange_rate) VALUES (?, ?, ?, ?)";
const editCurrency = "UPDATE user_currencies SET id_from_currencies = ?, id_to_currencies = ?, exchange_rate = ? WHERE id = ?";

// БД запросы к воспомогательным таблицам (под вопросом)
const getAllCurrencies = "SELECT * FROM all_currencies";
const getAllTypeOrder = "SELECT * FROM type_order";
const getAllUktzed = "SELECT * FROM uktzed";
const getAllTypeProduct = "SELECT * FROM type_product";

// БД запросы к type_price, storehouse, measure, expenditure, income_items   
const addItem = item => `INSERT INTO ${item} (id_user, name) VALUES (?, ?)`;
const editItem = item => `UPDATE ${item} SET name = ? WHERE id = ?`;

// БД запросы к banks_details
const addBankDetail = "INSERT INTO banks_details (id_user, bank_name, MFO, checking_account) VALUES (?, ?, ?, ?)";
const editBankDetail = "UPDATE banks_details SET bank_name = ?, MFO = ?, checking_account = ? WHERE id = ?";

// БД запросы к cashAccounts
const addCashAccount = "INSERT INTO cash_and_accounts (id_user, id_type_order, name, id_user_currencies, id_bank_details, balanceIn, turnoverDebt, turnoverCred, type, stream) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
const editCashAccount = "UPDATE cash_and_accounts SET id_type_order = ?, name = ?, id_user_currencies = ?, id_bank_details = ?, balanceIn = ?, turnoverDebt = ?, turnoverCred = ?, type = ?, stream = ? WHERE id = ?";

// БД запросы к Pay
const addPay = "INSERT INTO pay (id_user, number, date_create, id_type, type, type_order, id_cash_accounts, note, id_legal_entites) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
const editPay = "UPDATE pay SET date_create = ?, id_type = ?, type = ?, type_order = ?, id_cash_accounts = ?, note = ?, id_legal_entites WHERE id = ?"

// БД запросы к PayType
const getPayType = "SELECT * FROM pay_type WHERE pay_id = ?";
const addPayType = "INSERT INTO pay_type (pay_id, currency_id, amount, type_pay, type_amount, date_create) VALUES ?";
const editPayType = "UPDATE pay_type SET currency_id = ?, amount = ?, type_pay = ?, type_amount = ?, date_create = ? WHERE id = ?";
const removePayType = "DELETE FROM pay_type WHERE pay_id = ?";

// БД запросы к currency_exchange
const addCurrencyExchange = `INSERT INTO currency_exchange (id_user, date_create, from_currency_id, to_currency_id, exchange_rate, cash_account_id, amount_pay, amount_receive, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
const editCurrencyExchange = `UPDATE currency_exchange id_user = ?, date_create = ?, from_currency_id = ?, to_currency_id = ?, exchange_rate = ?, cash_account_id = ?, amount_pay = ?, amount_receive = ?, note = ? WHERE id = ?`;

// БД запросы к moving_money
const addMovingMoney = `INSERT INTO moving_money (id_user, date_create, from_cash_account_id, to_cash_account_id, amount, note) VALUES (?, ?, ?, ?, ?, ?)`;
const editMovingMoney = `UPDATE moving_money SET id_user = ?, date_create = ?, from_cash_account_id = ?, to_cash_account_id = ?, amount = ?, note = ? WHERE id = ?`;

module.exports = {
    GetUserByEmail,
    AddUser,
    UpdateUserPassword,
    UpdateUserGoogleAccount,
    UpdateUserFacebookAccount,

    GetAllGroupClients,
    AddClient,
    UpdateClient,

    AddSupplier,
    UpdateSupplier,

    AddEmployee,
    UpdateEmployee,

    editLegalEntites,
    addLegalEntites,

    addCurrency,
    editCurrency,

    getAllCurrencies,
    getAllTypeOrder,
    getAllUktzed,
    getAllTypeProduct,

    getItem,
    getItems,
    addItem,
    editItem,
    removeItem,

    addBankDetail,
    editBankDetail,

    addCashAccount,
    editCashAccount,

    addPay,
    editPay,

    getPayType,
    addPayType,
    editPayType,
    removePayType,

    addCurrencyExchange,
    editCurrencyExchange,
    
    editMovingMoney,
    addMovingMoney
}

// ALTER TABLE cash_and_accounts MODIFY id_user_currencies INT DEFAULT NULL, MODIFY id_bank_details INT DEFAULT NULL, MODIFY balanceIn decimal(15, 2) DEFAULT NULL, MODIFY turnoverDebt decimal(15, 2) DEFAULT NULL, MODIFY turnoverCred decimal(15, 2) DEFAULT NULL, MODIFY type varchar(68) DEFAULT NULL, MODIFY stream JSON DEFAULT NULL;