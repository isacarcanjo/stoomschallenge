import { app } from "./app";
import { Config } from "./config";
import { check } from "./config/database";
import { EApp } from "./config/enums";
import logger from './config/logger';


app.listen(Config.HTTP_PORT, () => {
    logger.info(`[api]     - http://localhost:${Config.HTTP_PORT}${EApp.PREFIX}`);
    logger.info(`[swagger] - http://localhost:${Config.HTTP_PORT}${EApp.PREFIX}/doc`);
    check(() => logger.info(`[mongo]   - up`))
});