import mongoose from "mongoose";
import { Config } from "./index";

mongoose.connect(Config.DATABASE_URL)
mongoose.Promise = global.Promise
export default mongoose

export const check = (cb: any) => mongoose.connect(Config.DATABASE_URL).then(cb);
