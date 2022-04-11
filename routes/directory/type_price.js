const express = require("express");
const router = express.Router();

const utils = require("../../controllers/utils");
const itemsController = require("../../controllers/items/items-controller");

router.post("/add", utils.isTokenValid, itemsController.add);
router.post("/:id/edit", utils.isTokenValid, itemsController.edit);
router.post("/:id/remove", utils.isTokenValid, itemsController.delete);
router.get("/", utils.isTokenValid, itemsController.all);
router.get("/:id", utils.isTokenValid, itemsController.id);

module.exports = router;