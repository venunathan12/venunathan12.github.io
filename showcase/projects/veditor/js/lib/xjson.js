config.libXJSON = {};

config.libXJSON.toXJSON = function (obj, byteArr)
{
    let objRaw = JSON.stringify(obj);
    let objLen = objRaw.length;

    let bytes = [];
    for (let c of objLen.toString()) bytes.push(c.charCodeAt(0));
    for (let c of objRaw) bytes.push(c.charCodeAt(0));
    bytes.splice(bytes.length, 0, ...byteArr);

    return bytes;
}

config.libXJSON.fromXJSON = function (byteArr)
{
    let jsonStart = byteArr.indexOf(123);
    let jsonSize = config.libStringOps.stringFromCharCodeArray(byteArr.splice(0, jsonStart));
    let jsonBody = JSON.parse(config.libStringOps.stringFromCharCodeArray(byteArr.splice(0, jsonSize)));

    return {
        "JSON": jsonBody,
        "RAW": byteArr
    }
}
