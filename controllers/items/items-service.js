const prisma = require("../../database/database");
const apiError = require("../../exceptions/error");

class itemsService {

    async add(table, object) {
        const dateMs = String(Date.now());

        const options = {
            ...object,
            created_at: dateMs,
            updated_at: dateMs
        }

        return await prisma[table].create({ data: options });
    }

    async edit(table, data, id, token) {
        const record = await prisma[table].findUnique({ where: { id: id } });

        // проверка на пренадлежность клиента к пользователю
        if (record?.id_user !== token.id) {
            throw apiError.unathorizedError();
        }

        const dateMs = String(Date.now());

        const options = {
            ...data,
            updated_at: dateMs
        }

        return await prisma[table].update({ data: options, where: { id: id } });
    }

    async delete(table, id, token) {
        const data = await prisma[table].findUnique({ where: { id: id } });

        // проверка на пренадлежность клиента к пользователю
        if (data?.id_user !== token.id) {
            throw apiError.unathorizedError();
        }

        return await prisma[table].delete({ where: { id: id } });
    }

    async all(page, limit, table, token) {

        const data = await prisma[table].findMany({ skip: limit * (page - 1), take: limit, where: { id_user: token.id } })
        const total = await prisma[table].count({ where: { id_user: token.id } });

        return {
            items: data,
            paginations: {
                total: total,
                last_page: total <= limit ? 1 : total / limit
            }
        }
    }

    async id(table, id, token) {

        const data = await prisma[table].findUnique({ where: { id: id } });

        // проверка на пренадлежность клиента к пользователю
        if (data?.id_user !== token.id) {
            throw apiError.unathorizedError();
        }

        return data;
    }

}

module.exports = new itemsService();