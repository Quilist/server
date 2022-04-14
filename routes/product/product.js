const express = require("express");
const router = express.Router();

const prisma = require("../../database/database");

router.get("/", (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    prisma.product.findMany({ skip: limit * (page - 1), take: limit })
        .then(async (result) => {

            for (const index in result) {
                result[index].mobile = JSON.parse(result[index]?.mobile)
                result[index].mail = JSON.parse(result[index]?.mail)
            }

            const total = await prisma.product.count();

            res.json({
                status: "OK", message: {
                    items: result,
                    paginations: {
                        total: total,
                        last_page: total <= limit ? 1 : total / limit
                    }
                }
            });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});

router.post("/add", (req, res) => {
    const dateMs = String(Date.now());

    const data = {
        ...req.body,
        created_at: dateMs,
        updated_at: dateMs
    }

    prisma.product.create({ data: { id_user: req.token.id, ...data } })
        .then(() => res.json({ status: "OK", message: "Success" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});


router.get("/:id", (req, res) => {

    prisma.product.findUnique({ where: { id: Number(req.params.id) } })
        .then((result) => {
            if (!result) return res.json({ status: "error", message: "Unknown id" });

            if (result.id_user !== req.token.id) {
                return res.json({ status: "error", message: "Action not allowed" });
            }

            result.mobile = JSON.parse(result.mobile);
            result.mail = JSON.parse(result.mail);

            res.json({ status: "OK", message: result });
        })
        .catch(err => res.json({ status: "error", message: err.message }));
});


router.post("/:id/edit", (req, res) => {
    const dateMs = String(Date.now());

    const data = {
        ...req.body,
        updated_at: dateMs
    }

    prisma.product.update({ data: { ...data }, where: { id: Number(req.params.id) } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

router.post("/:id/remove", (req, res) => {
    prisma.product.delete({ where: { id: Number(req.params.id) } })
        .then(() => res.json({ status: "OK", message: "Succes" }))
        .catch(err => res.json({ status: "error", message: err.message }));
});

module.exports = router;