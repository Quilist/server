const express = require("express");

const router = express.Router();

//Создание простой защиты от брутфорса
const ExpressBrute = require("express-brute");
const authController = require("../../controllers/auth/auth-controller");

const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store);

router.post("/login", bruteforce.prevent, authController.login);
router.post("/registration", authController.registration);
router.post("/logout", authController.logout);
router.post("/change-password", authController.changePassword);
router.get("/activation", authController.activation);
router.get("/restoration", authController.restoration);

module.exports = router;
