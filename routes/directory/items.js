const express = require("express");
const router = express.Router();

const query = require("../../db/dbRequests");
const utils = require("../utils");

// получение всех type_price, storehouse, measure, expenditure, income_items пользователя
router.get("/:db/", utils.isTokenValid, async (req, res) => utils.paginations(req, res, query.getItems(req.params.db), [req.token.id]));

// добавление type_price, storehouse, measure, expenditure, income_items
router.post("/:db/add", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.addItem(req.params.db), [req.token.id, req.body.name]], "Succes"));

// получение type_price, storehouse, measure, expenditure, income_items по айди
router.get("/:db/:id", utils.isTokenValid, async (req, res) => utils.dbRequestFromId(res, req, query.getItem(req.params.db), [req.params.id]));

// редактирование type_price, storehouse, measure, expenditure, income_items
router.post("/:db/:id/edit", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.editItem(req.params.db), [req.body.name, req.params.id]], "Succes"));

// Удаление type_price, storehouse, measure, expenditure, income_items
router.post("/:db/:id/remove", utils.isTokenValid, async (req, res) => utils.dbRequest(res, [query.removeItem(req.params.db), [req.params.id]], "Succes"));

module.exports = router;