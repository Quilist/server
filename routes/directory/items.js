const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const utils = require("../utils");

// получение всех type_price пользователя
router.get("/type_price/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("type_price"), [req.token.id]));

// добавление type_price
router.post("/type_price/add", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.addItem("type_price"), [req.token.id, req.body.name]], "Succes"));

// получение type_price по айди
router.get("/type_price/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem("type_price"), [req.params.id]));

// редактирование type_price
router.post("/type_price/:id/edit", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.editItem("type_price"), [req.body.name, req.params.id]], "Succes"));

// Удаление type_price
router.post("/type_price/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem("type_price"), [req.params.id]], "Succes"));


// получение всех storehouse пользователя
router.get("/storehouse/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("storehouse"), [req.token.id]));

// добавление storehouse
router.post("/storehouse/add", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.addItem("storehouse"), [req.token.id, req.body.name]], "Succes"));

// получение storehouse по айди
router.get("/storehouse/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem("storehouse"), [req.params.id]));

// редактирование storehouse
router.post("/storehouse/:id/edit", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.editItem("storehouse"), [req.body.name, req.params.id]], "Succes"));

// Удаление storehouse
router.post("/storehouse/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem("storehouse"), [req.params.id]], "Succes"));


// получение всех measure пользователя
router.get("/measure/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("measure"), [req.token.id]));

// добавление measure
router.post("/measure/add", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.addItem("measure"), [req.token.id, req.body.name]], "Succes"));

// получение measure по айди
router.get("/measure/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem("measure"), [req.params.id]));

// редактирование measure
router.post("/measure/:id/edit", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.editItem("measure"), [req.body.name, req.params.id]], "Succes"));

// Удаление measure
router.post("/measure/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem("measure"), [req.params.id]], "Succes"));


// получение всех expenditure пользователя
router.get("/expenditure/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("expenditure"), [req.token.id]));

// добавление expenditure
router.post("/expenditure/add", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.addItem("expenditure"), [req.token.id, req.body.name]], "Succes"));

// получение expenditure по айди
router.get("/expenditure/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem("expenditure"), [req.params.id]));

// редактирование expenditure
router.post("/expenditure/:id/edit", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.editItem("expenditure"), [req.body.name, req.params.id]], "Succes"));

// Удаление expenditure
router.post("/expenditure/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem("expenditure"), [req.params.id]], "Succes"));


// получение всех income_items пользователя
router.get("/income_items/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems("income_items"), [req.token.id]));

// добавление income_items
router.post("/income_items/add", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.addItem("income_items"), [req.token.id, req.body.name]], "Succes"));

// получение income_items по айди
router.get("/income_items/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem("income_items"), [req.params.id]));

// редактирование income_items
router.post("/income_items/:id/edit", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.editItem("income_items"), [req.body.name, req.params.id]], "Succes"));

// Удаление income_items
router.post("/income_items/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem("income_items"), [req.params.id]], "Succes"));

module.exports = router;