const apiError = require("../exceptions/error");

module.exports = (err, req, res, next) => {

    if (err instanceof apiError) {
        return res.status(err.status).json({ status: "error", message: err.error })
    }

    console.log(err.message)
    return res.status(500).json({ status: "error", message: err.message });
}