const logger = require('../config/logger');

const success = (data, message) => {
    return {
        success: true,
        data: data || {},
        alert: {
            type: "success",
            message,
        }
    }
}
const error = (message) => {
    return {
        success: false,
        alert: {
            type: "error",
            message,
        }
    }
}

const warning = (message) => {
    return {
        success: false,
        alert: {
            type: "warning",
            message,
        }
    }
}

// Middleware para transformar form-data em JSON
const formDataToJson = (req, res, next) => {
    if (req.body) {
        try {
            req.body = JSON.parse(JSON.stringify(req.body));
        } catch (error) {
            return res.status(400).send('Invalid form-data');
        }
    }
    next();
};


const exception = (res, e) => {
    logger.error(`${e?.message}, Stack Error: ${e?.stack}`);
    return res.status(500).json(error("Não foi possível realizar uma operação"));
}

export {
    success,
    error,
    warning,
    formDataToJson,
    exception,
}