const apiError = require("../exceptions/error");

module.exports = (err, req, res, next) => {

    if (err instanceof apiError) {
        return res.status(err.status).json({ status: "error", message: err.error })
    }
    
    return res.status(500).json({ status: "error", message: "Something broke!" });
}