const config = require('../config')
const crypto = require('crypto')
const     fs = require('fs')
const   path = require('path')
const    api = require('../config/api')
const  axios = require('axios')
const accUrl = path.join(__dirname, '../config/acc_token.js')
const  jsUrl = path.join(__dirname, '../config/js_ticket.js')
const   sign = require('./sign')

class wxAuthor {
  constructor(appid, appsecret, apptoken) {
    this.appid = appid
    this.appsecret = appsecret
    this.apptoken = apptoken
  }
  checkToken (ctx, next) {
    const signature = ctx.query.signature,
    timestamp = ctx.query.timestamp,
    nonce = ctx.query.nonce,
    echostr = ctx.query.echostr,
    token = this.apptoken
    //1. 将token、timestamp、nonce三个参数进行字典序排序
    var str = (new Array(token,timestamp,nonce)).sort().toString().replace(/,/g,"");
    //2. 将三个参数字符串拼接成一个字符串进行sha1加密
    var code = crypto.createHash("sha1").update(str,'utf-8').digest("hex");
    //3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
    console.log('code1 = ' + code)
    console.log('signature1 = ' + signature)
    return code === signature ? echostr : "success"
  }
  async getToken () {
    let response = {}
    const txt = await fs.readFileSync(accUrl).toString()
    if (txt) {
      let result = JSON.parse(txt)
      if (!!result.access_token && (Date.now() < result.expires_out)) {
        return result.access_token
      }
    }
    response = await axios.get(`${api.GET_TOKEN}?grant_type=client_credential&appid=${config.token.appid}&secret=${config.token.appsecret}`)
    response.data.expires_out = Date.now() + (response.data.expires_in - 20) * 1000
    fs.writeFileSync(accUrl, JSON.stringify(response.data))
    return response.data.access_token
  }
}
wxAuthor.prototype.createMenu = async function (menu) {
  const accessToken = await this.getToken()
  const url = `${api.MENU_CREATE}?access_token=${accessToken}`
  const response = await axios.post(url, menu)
  return response.data
}
wxAuthor.prototype.getMenu = async function () {
  const accessToken = await this.getToken()
  const url = `${api.GET_CREATE}?access_token=${accessToken}`
  const response = await axios.get(url)
  return response.data
}
wxAuthor.prototype.delMenu = async function () {
  const accessToken = await this.getToken()
  const url = `${api.DEL_CREATE}?access_token=${accessToken}`
  const response = await axios.get(url)
  return response.data
}
wxAuthor.prototype.addconditional = async function(menu) {
  const accessToken = await this.getToken()
  const url = `${api.ADD_CONDITIONAL}?access_token=${accessToken}`
  const response = await axios.post(url, menu)
  return response.data
}
wxAuthor.prototype.delConditional = async function() {
  const accessToken = await this.getToken()
  const url = `${api.DEL_CREATE}?access_token=${accessToken}`
  const response = await axios.post(url)
  return response.data
}
wxAuthor.prototype.matchconditional = async function() {
  const accessToken = await this.getToken()
  const url = `${api.MATCH_CONDITIONAL}?access_token=${accessToken}`
  const response = await axios.post(url)
  return response.data
}

wxAuthor.prototype.getcallbackip = async function() {
  const accessToken = await this.getToken()
  const url = `${api.CALLBACKIP}?access_token=${accessToken}`
  const response = await axios.get(url)
  return response.data
}

wxAuthor.prototype.checkOAuth = async function (token, opId) {
  const url = `https://api.weixin.qq.com/sns/auth?access_token=${token}&openid=${opId}`
  console.log('checkOAuth url='+ url)
  const response = await axios.get(url)
  console.log(JSON.stringify(response.data))
  return response.data
}

wxAuthor.prototype.refreshOAuth = async function (refreshToken) {
  const url = `https://api.weixin.qq.com/sns/auth2/refresh_token?appid=${this.appid}&grant_type=refresh_token&refresh_token=${refreshToken}`
  const response = await axios.get(url)
  console.log('refreshOAuth url='+ url)
  console.log(JSON.stringify(response.data))
  return response.data
}

wxAuthor.prototype.getOAuth = async function(code) {
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.appid}&secret=${this.appsecret}&code=${code}&grant_type=authorization_code`
  const response = await axios.get(url)
  console.log('getOAuth url='+ url)
  console.log(JSON.stringify(response.data))
  return response.data
}

wxAuthor.prototype.OAuth = async function(code) {
  if (this.oAuthToken) {
    let result = await this.checkOAuth(this.oAuthToken, this.oAuthOpenId)
    if (result.errcode === 0) {
      return {
        oAuthToken: this.oAuthToken,
        oAuthRefreshToken: this.oAuthRefreshToken,
        oAuthOpenId: this.oAuthOpenId
      }
    }
  } 
  let response = await this.getOAuth(code)
  this.oAuthToken = response.access_token
  this.oAuthRefreshToken = response.refresh_token
  this.oAuthOpenId = response.openid
  return {
    oAuthToken: this.oAuthToken,
    oAuthRefreshToken: this.oAuthRefreshToken,
    oAuthOpenId: this.oAuthOpenId
  }
}

wxAuthor.prototype.getUserInfo = async function(token, opId) {
  const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${token}&openid=${opId}&lang=zh_CN`
  const response = await axios.get(url)
  return response.data
}

wxAuthor.prototype.getJsTicket = async function() {
  let token = await this.getToken()
  const txt = await fs.readFileSync(jsUrl).toString()
  let result = txt ? JSON.parse(txt) : ''
  if (result && !result.errcode) {
    if (!!result.ticket && (Date.now() < result.expires_out)) {
      return result.ticket
    }
  }
  const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`
  const response = await axios.get(url)
  response.data.expires_out = Date.now() + (response.data.expires_in - 20) * 1000
  fs.writeFileSync(jsUrl, JSON.stringify(response.data))
  return response.data.ticket
}

wxAuthor.prototype.signature = async function (url) {
  let jsTicket = await this.getJsTicket()
  console.log('===signature===')
  let result = sign('jsapi_ticket', 'http://example.com')
  console.log(result)
  return result
}

let wx = new wxAuthor(config.token.appid, config.token.appsecret, config.token.token)
module.exports = wx