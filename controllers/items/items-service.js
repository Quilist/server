const prisma = require("../../database/database");
const apiError = require("../../exceptions/error");

class itemsService {

    async add(table, object) {
        return await prisma[table].create({ data: object });
    }

    async edit(table, data, id) {
        return await prisma[table].update({ data: data, where: { id: id } });
    }

    async delete(table, id) {
        return await prisma[table].delete({ where: { id: id } });
    }

    async all(page, limit, table) {

        const data = await prisma[table].findMany({ skip: limit * (page - 1), take: limit })
        const total = await prisma[table].count();

        return {
            items: data,
            paginations: {
                total: total,
                last_page: total <= limit ? 1 : total / limit
            }
        }
    }

    async id(table, id, token) {

        const data = await prisma[table].findUnique({ where: { id: id } })

        if (!data) throw apiError.badRequest("Unknow id");
        // проверка на пренадлежность клиента к пользователю
        if (data.id_user !== token.id) {
            throw apiError.unathorizedError();
        }

        return data;
    }

}

module.exports = new itemsService();