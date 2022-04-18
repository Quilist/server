const itemsService = require("./items-service");

class itemsController {

    async add(req, res, next) {
        try {
            await itemsService.add(req.originalUrl.split("/")[1], { id_user: req.token.id, ...req.body });

            return res.json({ status: "OK", message: "Succes" });
        } catch (e) {
            next(e)
        }
    }

    async edit(req, res, next) {
        try {
            await itemsService.edit(req.originalUrl.split("/")[1], { ...req.body }, Number(req.params.id));

            return res.json({ status: "OK", message: "Succes" });
        } catch (e) {
            next(e)
        }
    }

    async delete(req, res, next) {
        try {
            await itemsService.delete(req.originalUrl.split("/")[1], Number(req.params.id))

            return res.json({ status: "OK", message: "Succes" });
        } catch (e) {
            next(e)
        }
    }

    async all(req, res, next) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 25;

            const data = await itemsService.all(page, limit, req.originalUrl.split("/")[1])

            return res.json({ status: "OK", message: data })
        } catch (e) {
            next(e)
        }
    }

    async id(req, res, next) {
        try {
            const data = await itemsService.id(req.originalUrl.split("/")[1], Number(req.params.id), req.token)

            return res.json({ status: "OK", message: data });
        } catch (e) {
            next(e)
        }
    }
}

module.exports = new itemsController();