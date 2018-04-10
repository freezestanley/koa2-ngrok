var prefix = 'https://api.weixin.qq.com/cgi-bin'
module.exports = {
  GET_TOKEN: prefix + '/token',
  MENU_CREATE: prefix + '/menu/create',
  GET_CREATE: prefix + '/menu/get',
  DEL_CREATE: prefix + '/menu/delete',
  DEL_CONDITIONAL: prefix + '/menu/delconditional',
  ADD_CONDITIONAL: prefix + '/menu/addconditional',
  MATCH_CONDITIONAL: prefix + '/menu/trymatch',
  CALLBACKIP: prefix + '/getcallbackip'
}
