// 将unicode的buf(uint16)转换为字符串
function ab2str(buf) {
  // 注意，如果是大型二进制数组，为了避免溢出，
  // 必须一个一个字符地转
  if (buf && buf.byteLength < 1024) {
    return String.fromCodePoint.apply(null, new Uint32Array(buf));
  }

  const bufView = new Uint32Array(buf);
  const len =  bufView.length;
  const bstr = new Array(len);
  for (let i = 0; i < len; i++) {
    bstr[i] = String.fromCodePoint.call(null, bufView[i]);
  }
  return bstr.join('');
}
// 将字符串转换为unicode的buf(uint16)
function str2ab(str) {
  var byteArr = []
  for (let ch of str) {
    byteArr.push(ch.codePointAt(0))
  }
  const bufView = new Uint32Array(byteArr);
  return bufView.buffer;
}
function getStr(num) {
  let str = ''
  for (let i = 0; i < num; i++) {
      str+='本篇最初发表于一九一'
  }
  return str
}

// 将一段unicode的buf转换为utf8的16进制字符串
function unicode2Utf8Buf(buf=str2ab('严格')) {
  const bufView = new Uint32Array(buf);
  const len =  bufView.length;
  const bstr = new Array(len);
  for (let i = 0; i < len; i++) {
    var utf8R2 = unicode2Utf8Num(bufView[i])
    // '只有0xxxxxxx范围的utf8可能出现单数的16位, padStart上一位0'
    bstr[i] = parseInt(utf8R2,2).toString(16).padStart(2,'0')
  }
  return bstr.join('');
}
// 通过规则, 将单个(4字节)unicode编码(10进制数字), 转换utf8编码(1-4字节)的二进制字符串
function unicode2Utf8Num(unicodeNum) {
  /*
      0000 0000-0000 007F | 0xxxxxxx
      0000 0080-0000 07FF | 110xxxxx 10xxxxxx
      0000 0800-0000 FFFF | 1110xxxx 10xxxxxx 10xxxxxx
      0001 0000-0010 FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
   */
  let unicodeR2 = unicodeNum.toString(2)
  if (unicodeNum <= 127) {
    let pad =  unicodeR2.padStart(7,'0') 
    return `0${ pad }`
  } else if (unicodeNum <= 2047) {
    let pad =  unicodeR2.padStart(11,'0')
    return `110${ pad.slice(0,5) }10${ pad.slice(5) }`
  } else if (unicodeNum <= 65535) {
    let pad =  unicodeR2.padStart(16,'0')
    return `1110${ pad.slice(0,4) }10${ pad.slice(4,10) }10${ pad.slice(10) }`
  } else if (unicodeNum <= 1114111) {
    let pad =  unicodeR2.padStart(21,'0')
    return `11110${ pad.slice(0,3) }10${ pad.slice(3,9) }10${ pad.slice(9,15) }10${ pad.slice(15) }`
  } else {
    throw new Error('unicode大于0010 FFFF: ' + unicodeNum.toString(16))
  }
}

function str2Utf8(str) {
  return unicode2Utf8Buf(str2ab(str))
}

// 将uft8的16进制字符串转换为buf(uint8)
function utf82ab(utf8R16 = str2Utf8(`1f大于`)) {
  utf8R16 = utf8R16.replace(/\s/g,'')
  const buf = new ArrayBuffer(utf8R16.length/2)
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = utf8R16.length/2; i < strLen; i++) {
    var r16 = utf8R16.slice(2*i,2*i+2)
    bufView[i] = parseInt(r16,16)
  }
  return bufView
}

function utf8ToUnicodeBuf(buf = utf82ab().buffer) {
  const dv = new DataView(buf)
  let offset = 0, n = 0
  let str = ''
  function r2ToStr(r2) {

    let num = parseInt(r2,2)
    let ret = ab2str(new Uint32Array([num]))
    return ret
  }
  let isError = false
  while (offset < buf.byteLength && !isError) {
    try {
      let byteR2_1 = dv.getUint8(offset).toString(2).padStart(8,'0')
      let r2
      if (byteR2_1[0] === '0') {
        r2 = byteR2_1
        offset+=1
      } else if (byteR2_1[2] === '0') {
        let byteR2_2 = dv.getUint8(offset+1).toString(2).padStart(8,'0')
        r2 = byteR2_1.slice(3) + byteR2_2.slice(2)
        offset+=2
      } else if (byteR2_1[3] === '0') {
        let byteR2_2 = dv.getUint8(offset+1).toString(2).padStart(8,'0')
        let byteR2_3 = dv.getUint8(offset+2).toString(2).padStart(8,'0')
        r2 = byteR2_1.slice(4) + byteR2_2.slice(2) + byteR2_3.slice(2)
        offset+=3
      } else if (byteR2_1[4] === '0') {
        let byteR2_2 = dv.getUint8(offset+1).toString(2).padStart(8,'0')
        let byteR2_3 = dv.getUint8(offset+2).toString(2).padStart(8,'0')
        let byteR2_4 = dv.getUint8(offset+3).toString(2).padStart(8,'0')
        r2 = byteR2_1.slice(5) + byteR2_2.slice(2) + byteR2_3.slice(2) + byteR2_4.slice(2)
        offset+=4
      } else {
        throw new Error('uft-8格式不规范' + byteR2_1)
      }
      str += r2ToStr(r2)
    } catch(e) {
      isError = true
      console.log(e);
    }
  }
  return str
}
// 纪念刘和珍君
function utf8R16ToStr(r16 = `e8ae b0e5 bfb5 e588 98e5 928c e78f 8de5 909b`) {
  return utf8ToUnicodeBuf(utf82ab(r16.replace(/\s/g,'')).buffer)
}
// 每隔4个字符加一个空格
function codeSpaceAdd(str){
  return str.split('').map((a,i)=>{
    if (i%4===3) {
      return a+' '
    } else {
      return a
    }
  }).join('')
}
// 每隔4个字符加一个空格
function codeSpaceRemove(str){
  return str.replace(/\s/g,'')
}


let vm = new Vue({
  el: '#app',
  data: {
    inputText: '',
    output: '',
    outputType: 1, // 1有空格, 2无空格
    unicodeArrayBuffer: null,
    str2Utf8Data: [],
    uft82StrData: [],
    textfieldValue: '',
  },
  mounted(){
    autosize(this.$refs.textarea)
    this.addText(0)
  },
  watch: {
    inputText: function () {
      this.textfieldValue = this.inputText
      this.$nextTick(() => {
        autosize.update(this.$refs.textarea)
      })
    }
  },
  methods: {
    outputTypeToggle(){
      if (this.outputType === 1) {
        this.output = codeSpaceRemove(this.output)
        this.outputType = 2
      } else {
        this.output = codeSpaceAdd(this.output)
        this.outputType = 1
      }
    },
    addText(type){
      switch (type) {
        case 0:
          this.inputText =  `1aX(
αβΔΣ
常用汉字
𠀀𠀁𠀂𠀃`
          break;
        case 1:
          this.inputText =  `赴戍登程口占示家人
清 林则徐
力微任重久神疲，再竭衰庸定不支。
苟利国家生死以，岂因祸福避趋之？
谪居正是君恩厚，养拙刚于戍卒宜。
戏与山妻谈故事，试吟断送老头皮。`
          break;
        case 2:
          this.inputText = `316158280aceb1ceb2ce94cea30ae5b8b8e794a8e6b189e5ad970af0a08080f0a08081f0a08082f0a08083`
          break
        case 3:
          this.inputText = `e88b9fe588a9e59bbde5aeb6e7949fe6adbbe4bba5efbc8ce5b282e59ba0e7a5b8e7a68fe981bfe8b68be4b98befbc9f`
          break
        default:
          // statements_def
          break;
      }
    },
    str2Utf8(){
      this.uft82StrData = []
      this.str2Utf8Data = []
      this.outputType = 1
      this.unicodeArrayBuffer = str2ab(this.inputText)
      let nIndex = 0
      new Uint32Array(this.unicodeArrayBuffer).forEach((uint32,index)=>{

        let unicodeType 
        let unicodeTypeText 
        if (uint32 <= 127) {
          unicodeType = 0
          unicodeTypeText = "0-7F"
        } else if (uint32 <= 2047) {
          unicodeType = 1
          unicodeTypeText = "80-7FF"
        } else if (uint32 <= 65535) {
          unicodeType = 2
          unicodeTypeText = "800-FFFF"
        } else if (uint32 <= 1114111) {
          unicodeType = 3
          unicodeTypeText = "10000-10FFFF"
        }
        let r16 = uint32.toString(16)
        let r16Len = r16.length
        let r16Obj = r16.padStart(8,'0').split('').map((a,i)=>{
          return {
            letter: a,
            isPad: i < 8 - r16Len,
          }
        })

  /*
      0000 0000-0000 007F | 0xxxxxxx
      0000 0080-0000 07FF | 110xxxxx 10xxxxxx
      0000 0800-0000 FFFF | 1110xxxx 10xxxxxx 10xxxxxx
      0001 0000-0010 FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
   */
        let r2 = uint32.toString(2)
        let r2Len = r2.length
        let r2Obj = r2.padStart(32,'0').split('').map((a,i)=>{
          let color = 0
          if (unicodeType === 0) {
            if (i >= 32 - 7) {
              color = 1
            }
          } else if (unicodeType === 1) {
            if (i >= 32 - 6) {
              color = 1
            } else if (i >= 32 - 11) {
              color = 2
            }
          } else if (unicodeType === 2) {
            if (i >= 32 - 6) {
              color = 1
            } else if (i >= 32 - 12) {
              color = 2
            } else if (i >= 32 - 16) {
              color = 3
            }
          } else if (unicodeType === 3) {
            if (i >= 32 - 6) {
              color = 1
            } else if (i >= 32 - 12) {
              color = 2
            } else if (i >= 32 - 18) {
              color = 3
            } else if (i >= 32 - 21) {
              color = 4
            }
          }
          return {
            letter: a,
            isPad: i < 32 - r2Len,
            color,
          }
        })
        let pad 
        let unicodeR2 = uint32.toString(2)
        let utf8
        let utf8R2Obj
        if (uint32 <= 127) {
          pad =  unicodeR2.padStart(7,'0')
          utf8 = `0${ pad }`
          utf8R2Obj = [
            {letter: "0",color: 0,}
          ].concat(pad.split('').map(a => {
            return {
              letter: a, color: 1
            }
          }))
        } else if (uint32 <= 2047) {
          pad =  unicodeR2.padStart(11,'0')
          utf8 = `110${ pad.slice(0,5) }10${ pad.slice(5) }`
          utf8R2Obj = [
            {letter: "1",color: 0},
            {letter: "1",color: 0},
            {letter: "0",color: 0},
          ].concat(pad.slice(0,5).split('').map(a => {
            return {
              letter: a, color: 2
            }
          })).concat([
            {letter: "1",color: 0},
            {letter: "0",color: 0},
          ]).concat(pad.slice(5).split('').map(a => {
            return {
              letter: a, color: 1
            }
          }))
        } else if (uint32 <= 65535) {
          pad =  unicodeR2.padStart(16,'0')
          utf8 = `1110${ pad.slice(0,4) }10${ pad.slice(4,10) }10${ pad.slice(10) }`
          utf8R2Obj = [
            {letter: "1",color: 0},
            {letter: "1",color: 0},
            {letter: "1",color: 0},
            {letter: "0",color: 0},
          ].concat(pad.slice(0,4).split('').map(a => {
            return {
              letter: a, color: 3
            }
          })).concat([
            {letter: "1",color: 0},
            {letter: "0",color: 0},
          ]).concat(pad.slice(4,10).split('').map(a => {
            return {
              letter: a, color: 2
            }
          })).concat([
            {letter: "1",color: 0},
            {letter: "0",color: 0},
          ]).concat(pad.slice(10).split('').map(a => {
            return {
              letter: a, color: 1
            }
          }))
        } else if (uint32 <= 1114111) {
          pad =  unicodeR2.padStart(21,'0')
          utf8 = `11110${ pad.slice(0,3) }10${ pad.slice(3,9) }10${ pad.slice(9,15) }10${ pad.slice(15) }`
          utf8R2Obj = [
            {letter: "1",color: 0},
            {letter: "1",color: 0},
            {letter: "1",color: 0},
            {letter: "1",color: 0},
            {letter: "0",color: 0},
          ].concat(pad.slice(0,3).split('').map(a => {
            return {
              letter: a, color: 4
            }
          })).concat([
            {letter: "1",color: 0},
            {letter: "0",color: 0},
          ]).concat(pad.slice(3,9).split('').map(a => {
            return {
              letter: a, color: 3
            }
          })).concat([
            {letter: "1",color: 0},
            {letter: "0",color: 0},
          ]).concat(pad.slice(9,15).split('').map(a => {
            return {
              letter: a, color: 2
            }
          })).concat(pad.slice(15).split('').map(a => {
            return {
              letter: a, color: 1
            }
          }))
        } else {
          throw new Error('unicode大于0010 FFFF: ' + uint32.toString(16))
        }

        let uft8R16 = unicode2Utf8Buf([uint32])
        let addLen = unicodeType == 3 ? 2 : 1;
        let text = this.inputText.slice(nIndex,nIndex + addLen)
        this.str2Utf8Data.push({
          type: 1,
          text: text,
          r2: r2Obj,
          r16: r16Obj,
          unicodeType,
          unicodeTypeText,
          uft8R2: utf8R2Obj,
          uft8R16: uft8R16,
        })
        nIndex += addLen
      })
      this.output = codeSpaceAdd(str2Utf8(this.inputText))
      this.$forceUpdate()
    },
    utf82Str(){
      const reg = /^[\da-f\s]*$/gi
      if (!reg.test(this.inputText)) {
        alert('请输入合法的uft8十六进制值\n仅允许:  数字0-9, 英文a-f, 空字符')
        return
      }
      this.uft82StrData = []
      this.str2Utf8Data = []
      let buf = utf82ab(this.inputText).buffer
      const dv = new DataView(buf)
      let offset = 0, n = 0
      let str = ''
      function r2ToStr(r2) {
        let num = parseInt(r2,2)
        let ret = ab2str(new Uint32Array([num]))
        return ret
      }
      let isError = false
      while (offset < buf.byteLength && !isError) {
        try {
          let byteR2_1 = dv.getUint8(offset).toString(2).padStart(8,'0')
          let arg = []
          let r2
          if (byteR2_1[0] === '0') {
            r2 = dv.getUint8(offset).toString(2).padStart(8,'0')
            r2Obj = r2.split('').map((a,i)=>{
              return {
                letter: a,
                color: i < 1 ? 0 : 1,
              }
            })
            arg.push(
              {r2,r2Obj,byteLength:1}
            )
            offset+=1
          } else if (byteR2_1[2] === '0') {
            let byteR2_2 = dv.getUint8(offset+1).toString(2).padStart(8,'0')
            r2 = byteR2_1.slice(3) + byteR2_2.slice(2)
            arg.push(
              {
                r2:byteR2_1,
                byteLength:2,
                r2Obj: byteR2_1.split('').map((a,i)=>{
                  return {
                    letter: a,
                    color: i < 3 ? 0 : 1,
                  }
                })
              },
              {
                r2:byteR2_2,
                r2Obj: byteR2_2.split('').map((a,i)=>{
                  return {
                    letter: a,
                    color: i < 2 ? 0 : 2,
                  }
                })
              }
            )
            offset+=2
          } else if (byteR2_1[3] === '0') {
            let byteR2_2 = dv.getUint8(offset+1).toString(2).padStart(8,'0')
            let byteR2_3 = dv.getUint8(offset+2).toString(2).padStart(8,'0')
            r2 = byteR2_1.slice(4) + byteR2_2.slice(2) + byteR2_3.slice(2)
            arg.push(
              {
                r2:byteR2_1,
                byteLength:3,
                r2Obj: byteR2_1.split('').map((a,i)=>{
                  return {
                    letter: a,
                    color: i < 4 ? 0 : 1,
                  }
                })
              },
              {
                r2:byteR2_2,
                r2Obj: byteR2_2.split('').map((a,i)=>{
                  return {
                    letter: a,
                    color: i < 2 ? 0 : 2,
                  }
                })
              },
              {
                r2:byteR2_3,
                r2Obj: byteR2_3.split('').map((a,i)=>{
                  return {
                    letter: a,
                    color: i < 2 ? 0 : 3,
                  }
                })
              }
            )
            offset+=3
          } else if (byteR2_1[4] === '0') {
            let byteR2_2 = dv.getUint8(offset+1).toString(2).padStart(8,'0')
            let byteR2_3 = dv.getUint8(offset+2).toString(2).padStart(8,'0')
            let byteR2_4 = dv.getUint8(offset+3).toString(2).padStart(8,'0')
            r2 = byteR2_1.slice(5) + byteR2_2.slice(2) + byteR2_3.slice(2) + byteR2_4.slice(2)
            arg.push(
              {
                r2:byteR2_1,
                byteLength:4,
                r2Obj: byteR2_1.split('').map((a,i)=>{
                  return {
                    letter: a,
                    color: i < 5 ? 0 : 1,
                  }
                })
              },
              {
                r2:byteR2_2,
                r2Obj: byteR2_2.split('').map((a,i)=>{
                  return {
                    letter: a,
                    color: i < 2 ? 0 : 2,
                  }
                })
              },
              {
                r2:byteR2_3,
                r2Obj: byteR2_3.split('').map((a,i)=>{
                  return {
                    letter: a,
                    color: i < 2 ? 0 : 3,
                  }
                })
              },
              {
                r2:byteR2_4,
                r2Obj: byteR2_4.split('').map((a,i)=>{
                  return {
                    letter: a,
                    color: i < 2 ? 0 : 4,
                  }
                })
              }
            )
            offset+=4
          } else {
            throw new Error('uft-8格式不规范' + byteR2_1)
          }
          arg[0].allR2 = r2
          arg.forEach(item=>{
            item.r16 = parseInt(item.r2,2).toString(16).padStart(2,'0')
          })
          arg[0].allR16 = parseInt(r2,2).toString(16).padStart(8,'0')
          arg[0].allR2Obj = []
          arg.forEach(item=>{
            item.r2Obj.forEach(a=>{
              if (a.color !== 0) {
                arg[0].allR2Obj.push(a)
              }
            })
          })
          let newStr = r2ToStr(r2)
          arg[0].newStr = newStr
          str += newStr
          this.uft82StrData.push(...arg)
        } catch(e) {
          isError = true
          console.log(e);
        }
      }
      this.output = str
    },
    blank(str,num) {
      var ret = ''
      str.split('').forEach((s,index)=>{
        if (index%num === 0) {
          ret+=' '
        }
        ret+=s
      })
      return ret.trim()
    },
  },
})