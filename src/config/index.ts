import { config } from 'dotenv'
config()

const Config: IConfig = {
    ENV: process.env.ENV || "dev",
    HTTP_PORT: process.env.HTTP_PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    SECRET_TOKEN: process.env.SECRET_TOKEN,
    SECRET_TOKEN_ADMIN: process.env.SECRET_TOKEN_ADMIN,
    SECRET_TOKEN_MOBILE: process.env.SECRET_TOKEN_MOBILE,
    ACCESS_TOKEN_DURATION_MINUTES: process.env.ACCESS_TOKEN_DURATION_MINUTES,
    ACCESS_TOKEN_DURATION_MINUTES_MOBILE: process.env.ACCESS_TOKEN_DURATION_MINUTES_MOBILE,
    REFRESH_TOKEN_DURATION_MINUTES: process.env.REFRESH_TOKEN_DURATION_MINUTES,
    SECRET_SALT: process.env.SECRET_SALT,
    SECRET_SALT_ADMIN: process.env.SECRET_SALT_ADMIN,
    API_VERSION: process.env.API_VERSION,
    SOCKET_PORT: process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT): null,
    DEBUG: process.env.DEBUG ? Boolean(process.env.DEBUG) : false,
    GEO_REVERSE: process.env.GEO_REVERSE ? Boolean(process.env.GEO_REVERSE) : false,
};

export interface IConfig {
    ENV: string
    HTTP_PORT: string
    DATABASE_URL: string,
    SECRET_TOKEN: string,
    SECRET_TOKEN_ADMIN: string,
    SECRET_TOKEN_MOBILE: string,
    ACCESS_TOKEN_DURATION_MINUTES: string,
    ACCESS_TOKEN_DURATION_MINUTES_MOBILE: string,
    REFRESH_TOKEN_DURATION_MINUTES: string,
    SECRET_SALT: string,
    SECRET_SALT_ADMIN: string,
    API_VERSION: string,
    SOCKET_PORT: number,
    DEBUG: boolean,
    GEO_REVERSE: boolean,
}

export { Config };
