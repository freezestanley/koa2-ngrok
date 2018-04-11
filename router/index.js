const   router = require('koa-router')()
const wxAuthor = require('../until/wxAuthor')
const      tpl = require('../until/tpl')
const   crypto = require('crypto')
const      api = require('../config/api')
const   condit = require('../config/conditional')
const baseurl = 'https://64415613.ngrok.io/userinfo'

router.get('/', async (ctx, next) => {
  await ctx.render('index')
  await next()
})

router.get('/author', async (ctx, next) => {
  ctx.body = wxAuthor.checkToken(ctx)
  await next()
}).post('/author', async (ctx, next) => {
  var data = ctx.req.body.xml
  console.dir(data)
  var info = {
    toUsername: data.fromusername,
    fromUsername: data.tousername,
  }
  if (data.content === '1') {
    info.msgType = data.msgtype,
    info.content = data.content
  } else if (data.content === '2') {
    info.msgType = 'music',
    info.content = {
                    title: 'Lemon Tree',
                    description: 'Lemon Tree',
                    musicUrl: 'http://mp3.com/xx.mp3',
                  }
  } else if (data.content === '3') {
    info.msgType = 'news',
    info.content = [
      {
        'title': 'this is news1',
        'description': 'this is news1 description',
        'picUrl': 'http://static.zcool.cn/git_z/z/images/boy.png',
        'url': 'www.163.com'
      }
    ]
  } else {
    info.msgType = 'text',
    info.content = `event: ${data.event}`
  }
  if (data.msgtype === 'event') {
    switch (data.event) {
      case 'subscribe':
        info.msgType = 'text'
        info.content = `welcome ~~~~~!!`
      break;
      case 'unsubscribe':
        info.msgType = 'text'
        info.content = `bye bye ~~~~~!!`
      break;
      case 'LOCATION':
        info.msgType = 'text'
        info.content = `latitude: ${data.latitude} longitude: ${data.longitude}`
      break;
      default:
        info.msgType = 'text',
        info.content = `event: ${data.event}`
      break;
    }
  }
  ctx.res.writeHead(200, {'Content-Type': 'application/xml'})
  ctx.res.end(tpl(info))
  await next()
})

router.get('/menu/:key', async (ctx, next) => {
  let param = ctx.params.key
  let url = ''
  // let token = await wxAuthor.getToken()
  let result = ''
  if (param == 'create') {
    result = await wxAuthor.createMenu({
      "button": [
        {
          "type": "click",
          "name": "gogo",
          "key": "V1001_TODAY_MUSIC",
          "sub_button": [
            {
              "type": "view",
              "name": "jump",
              "url": `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx1b68751d55b0d827&redirect_uri=${encodeURIComponent(baseurl)}&response_type=code&scope=snsapi_userinfo&state=123#wechat_redirect`
            }
          ]
        }]
    })
    console.log(result)
  } else if (param == 'delete') {
    result = await wxAuthor.delMenu()
    console.log(result)
  } else if (param == 'get') {
    result = await wxAuthor.getMenu()
    console.dir(JSON.stringify(result))
  } else if (param == 'add') {
    result = await wxAuthor.addconditional(condit)
    console.dir(result)
  } else if (param == 'del') {
    result = await wxAuthor.delConditional()
    console.dir(result)
  } else if (param == 'match') {
    result = await wxAuthor.matchconditional()
    console.dir(result)
  }
  await next()
})

router.get('/ip', async (ctx, next) => {
  let result = await wxAuthor.getcallbackip()
  ctx.body = result.ip_list.join('')
  console.dir(result)
})
//https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx1b68751d55b0d827&redirect_uri=https%3a%2f%2fca6eb373.ngrok.io%2fuserinfo&response_type=code&scope=snsapi_userinfo&state=123#wechat_redirect
//https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx1b68751d55b0d827&redirect_uri=https%3a%2f%2fca6eb373.ngrok.io%2fuserinfo&response_type=code&scope=snsapi_base&state=123#wechat_redirect
router.get('/userinfo', async (ctx, next) => {
  await ctx.render('userinfo')
  await next()
})
router.post('/signature', async (ctx, next) => {
  let data = await wxAuthor.OAuth(ctx.request.body.code)
  let jsticket = await wxAuthor.signature(`${baseurl}?code=${ctx.request.body.code}&state=123`)
  jsticket.appid = this.appid
  // let info = await wxAuthor.getUserInfo(data.oAuthToken, data.oAuthOpenId)
  ctx.body = jsticket
  await next()
})

router.post('/user', async (ctx, next) => {
  let data = await wxAuthor.OAuth(ctx.request.body.code)
  let info = await wxAuthor.getUserInfo(data.oAuthToken, data.oAuthOpenId)
  ctx.body = info
  await next()
})

router.post('/test', async (ctx, next) => {
  ctx.body = 'this is test post'
  await next()
}).get('/test', async (ctx, next) => {
  ctx.body = 'this is test get'
  await next()
})
module.exports = router