config.libStringOps = {};

config.libStringOps.charArrayFromString = function (string)
{
    let chars = [];
    for (let c of string)    
        chars.push(c);
    return chars;
}

config.libStringOps.byteArrayFromString = function (string)
{
    let bytes = [];
    for (let c of string)    
        bytes.push(c.charCodeAt(0));
    return bytes;
}

config.libStringOps.byteArrayFromWordArray = function (arrObj)
{
    let bytes = [];
    for (let i = 0; i < arrObj.sigBytes; i++)    
        bytes.push((arrObj.words[Math.floor(i / 4)] >> (3 - i % 4) * 8) & 0xff);
    return bytes;
}

config.libStringOps.stringFromCharCodeArray = function (arr)
{
    let result = [];
    for (let c of arr)
        result.push(String.fromCharCode(c));
    return result.join('');
}

config.libStringOps.stringFromWordArray = function (arrObj)
{
    let bytes = config.libStringOps.byteArrayFromWordArray(arrObj);
    return config.libStringOps.stringFromCharCodeArray(bytes);
}
