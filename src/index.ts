import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { env } from "./utils/env";

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

