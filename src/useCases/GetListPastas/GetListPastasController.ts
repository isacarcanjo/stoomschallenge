import { Request, Response } from "express";
import { Pasta } from "../../entities/Pasta";
import { GetListPastasCase } from "./GetListPastasCase";

export class GetListPastasController {
    constructor(
        private GetListPastasCase: GetListPastasCase,
    ) { }

    async get(request: Request, response: Response): Promise<Response> {
        try {
            var data: Pasta[] = await this.GetListPastasCase.queryAll()
            return response.json(data);
        } catch (err) {
            return response.status(400).json({
                message: err.message || 'Unexpected error.'
            })
        }
    }
    
    async getAll(request: Request, response: Response): Promise<Response> {
        try {
            var data: Pasta[] = await this.GetListPastasCase.queryAll()
            return response.json(data);
        } catch (err) {
            return response.status(400).json({
                message: err.message || 'Unexpected error.'
            })
        }
    }
}