"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_1 = require("./swagger");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const records_1 = require("./routes/records");
const dashboard_1 = require("./routes/dashboard");
const errorHandler_1 = require("./utils/errorHandler");
function createApp() {
    const app = (0, express_1.default)();
    // Default Helmet CSP blocks Swagger UI inline scripts/styles — response body won't show after Execute.
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use((0, morgan_1.default)("dev"));
    const swaggerSpec = (0, swagger_1.buildSwaggerSpec)();
    app.get("/openapi.json", (_req, res) => {
        return res.json(swaggerSpec);
    });
    const publicDir = path_1.default.join(process.cwd(), "public");
    app.use(express_1.default.static(publicDir));
    // Bundled Swagger UI (may render blank in some browsers); use /index.html or /swagger.html as fallback.
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    // Root: simple HTML tester (fetch + JSON — always visible).
    app.get("/", (_req, res) => {
        return res.redirect(302, "/index.html");
    });
    app.get("/health", (_req, res) => {
        return res.json({ ok: true });
    });
    app.use("/api/auth", auth_1.authRouter);
    app.use("/api/users", users_1.usersRouter);
    app.use("/api/records", records_1.recordsRouter);
    app.use("/api/dashboard", dashboard_1.dashboardRouter);
    // 404
    app.use((_req, res) => {
        return res.status(404).json({ error: { message: "Not found" } });
    });
    // Error handler
    app.use(errorHandler_1.errorHandler);
    return app;
}
