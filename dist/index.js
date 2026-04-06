"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./app");
const env_1 = require("./utils/env");
const app = (0, app_1.createApp)();
app.listen(env_1.env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env_1.env.PORT}`);
});
