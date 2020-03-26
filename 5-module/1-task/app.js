const path = require('path');
const Koa = require('koa');
const app = new Koa();

app.use(require('koa-static')(path.join(__dirname, 'public')));
app.use(require('koa-bodyparser')());

const Router = require('koa-router');
const router = new Router();
const subscribers = {};

router.get('/subscribe', async (ctx, next) => {
  ctx.body = await new Promise((resolve) => {
    subscribers[Math.random()] = resolve;
  });
});

router.post('/publish', async (ctx, next) => {
  if (!ctx.request.body.message) return;

  for (const key in subscribers) {
    if (subscribers[key]) {
      subscribers[key](ctx.request.body.message);
      delete subscribers[key];
    }
  }
  ctx.status = 200;
});

app.use(router.routes());

module.exports = app;
