import { createApp } from './app.js';
import { config } from './config.js';
import { createDb } from './database.js';

const app = createApp(createDb(config.dbFile));

app.listen(config.port, () => {
  console.log(`API rodando em http://localhost:${config.port}/api`);
});
