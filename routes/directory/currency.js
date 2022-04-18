const express = require("express");
const router = express.Router();

const itemsController = require("../../controllers/items/items-controller");

router.post("/:id/edit", itemsController.edit);
router.post("/add", itemsController.add);
router.post("/:id/remove", itemsController.delete);
router.get("/", itemsController.all);
router.get("/:id", itemsController.id);

module.exports = router;

