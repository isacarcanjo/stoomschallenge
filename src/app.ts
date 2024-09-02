import express from 'express'
import { operatorRoutes } from './routes'
import cors from 'cors'
import bodyParser from 'body-parser'
import { EApp } from './config/enums'

const app = express()
app.use(cors({
    origin: "*", preflightContinue: false, optionsSuccessStatus: 200, credentials: true,
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ strict: true }));
app.use(bodyParser.raw());
app.use(express.json())
app.use(EApp.PREFIX.toString(), operatorRoutes)


export { app }