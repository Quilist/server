const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.post("/:id/edit", async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.pay.update({ data: req.body, where: { id: +id } });

        res.json({ status: "OK", message: "Success" });
    } catch (e) {
        res.json({ status: "error", message: e.message });
    }
});

router.post("/:id/remove", async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.pay.delete({ where: { id: +id } });

        res.json({ status: "OK", message: "Success" });
    } catch (e) {
        res.json({ status: "error", message: e.message });
    }
});

module.exports = router;

