 const koa = require('koa'),
       app = new koa(),
bodyParser = require('koa-bodyparser'),
 koaStatic = require('koa-static'),
     views = require('koa-views'),
   onerror = require('koa-onerror'),
 xmlParser = require('koa-xml-parser'),
    router = require('./router'),
    config = require('./config'),
    logger = require('./until/log'),
      path = require('path')

app.use(xmlParser({
  limit: '1MB',           // Reject payloads larger than 1 MB
  encoding: 'UTF-8',      // Explicitly set UTF-8 encoding
  xml: {
    normalize: true,      // Trim whitespace inside text nodes
    normalizeTags: true,  // Transform tags to lowercase
    explicitArray: false  // Only put nodes in array if >1
  }
}))

onerror(app)
app.use(bodyParser({
  enableTypes:['json', 'form', 'text']
}))

//静态服务器资源
app.use(views(path.resolve(__dirname, './application')))
app.use(koaStatic(path.resolve(__dirname, './application')))

// 查看请求 post: url
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method}: ${ctx.request.url}`)
  await next()
});

// 执行时间
app.use(async (ctx, next) => {
  const start = new Date().getTime(); // 当前时间
  await next(); // 调用下一个middleware
  const ms = new Date().getTime() - start; // 耗费时间
  console.log(`Time: ${ms}ms`); // 打印耗费时间
});

logger.warn('starting')
app.use(router.routes())
app.listen(config.port)
console.log(`app start at port ${config.port}...`)
