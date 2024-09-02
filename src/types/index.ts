import { Request } from "express";
import IUser from "../entities/IUser";

export interface RequestCustom extends Request
{
    user: IUser;
}

