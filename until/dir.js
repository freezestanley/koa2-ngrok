const fs = require('fs'),
    path = require('path')

// 生成文件夹
function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
      return true;
  } else {
      if (mkdirsSync(path.dirname(dirname))) {
          fs.mkdirSync(dirname);
          return true;
      }
  }
}
function writeFile (url, data) {
  var dir = path.parse(url).dir
  mkdirsSync(dir)
  fs.writeFileSync(url, data)
}

module.exports = {
  mkdirsSync,
  writeFile
}