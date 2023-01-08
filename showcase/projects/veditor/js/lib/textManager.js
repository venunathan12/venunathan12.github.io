config.libTextManager = {};

config.libTextManager.CLASS = class
{
    constructor (editorId, path)
    {
        this.editorId = editorId;
        this.path = path;
        this.lines = [[]];
        this.META = null;
    }
    async getDataFromServer()
    {
        let path = this.path; if (path.startsWith('./')) path = path.slice(2);
        
        let zip = config.selectedProjectZip;
        let file = zip.file('proj/' + path), rawString = null;
        if (file != null) rawString = await file.async('string');
        if (rawString == null) throw 'File not found in Project !!!';

        this.loadFromByteArray(config.libStringOps.byteArrayFromString(rawString));
    }
    async getMetaFromServer()
    {
        let path = this.path + '.meta'; if (path.startsWith('./')) path = path.slice(2);
        
        let zip = config.selectedProjectZip;
        let file = zip.file('meta/' + path), rawString = 'null';
        if (file != null) rawString = await file.async('string');

        this.META = JSON.parse(rawString);
        if (this.META == null)
            this.META = {};
        if (this.path != './'&& this.META.fileId == null)
            this.META.fileId = config.selectedProjectMeta.META.fileIdx, config.selectedProjectMeta.META.fileIdx ++;
    }
    async saveDataToServer()
    {
        let path = this.path; if (path.startsWith('./')) path = path.slice(2);

        let zip = config.selectedProjectZip;
        zip.file('proj/' + path, config.libStringOps.stringFromCharCodeArray(this.getRawBytes()));
        
        return true;
    }
    async saveMetaToServer()
    {
        let path = this.path + '.meta'; if (path.startsWith('./')) path = path.slice(2);

        let zip = config.selectedProjectZip;
        zip.file('meta/' + path, JSON.stringify(this.META, null, 4));

        return true;
    }

    loadFromByteArray(bytesIN)
    {
        this.lines = [[]];
        for (let byte of bytesIN)
        {
            let skip = false;
            switch (String.fromCharCode(byte))
            {
                case '\r':
                    skip = true; break;

                case '\n':
                    this.lines.push([]);
                    skip = true; break;
            }
            if (skip)
                continue;

            let line = this.lines.at(-1);
            line.push(byte);
        }
    }

    __insert(line, idx, c, bidxArr)
    {
        let insertBidx = this.toByteIdx([line, idx]);

        if (c != '\n')
            this.lines[line].splice(idx, 0, c.charCodeAt(0));
        else
        {
            let rightText = this.lines[line].splice(idx, this.lines[line].length - idx);
            this.lines.splice(line + 1, 0, []);
            for (let ci of rightText.reverse()) this.lines[line + 1].splice(0, 0, ci);
        }

        for (let i = 0; i < bidxArr.length; i++)
            if (i == 0)
            {
                if (insertBidx <= bidxArr[i]) bidxArr[i] ++;
            }
            else
            {
                if (i % 2 == 1)
                {
                    if (insertBidx < bidxArr[i]) bidxArr[i] ++;
                }
                else
                {
                    if (insertBidx < bidxArr[i]) bidxArr[i] ++;
                }
            }
    }
    __del (line, idx, bidxArr)
    {
        let deleteBidx = this.toByteIdx([line, idx]);

        if (idx >= this.lines[line].length)
        {
            if (line + 1 < this.lines.length)
            {
                let prevLine = this.lines.splice(line + 1, 1);
                for (let ci of prevLine[0])
                    this.lines[line].push(ci);
            }
        }
        else
            this.lines[line].splice(idx, 1);
        
        for (let i = 0; i < bidxArr.length; i++)
            if (i == 0)
            {
                if (deleteBidx < bidxArr[i]) bidxArr[i] --;
            }
            else
            {
                if (i % 2 == 1)
                {
                    if (deleteBidx < bidxArr[i]) bidxArr[i] --;
                }
                else
                {
                    if (deleteBidx < bidxArr[i]) bidxArr[i] --;
                }
            }
    }
    __bulk (line, idx, delsize, data, bidxArr)
    {
        let insertBidx = this.toByteIdx([line, idx]);
        let deleteBidx = insertBidx + data.length;
        
        for (let c of config.libStringOps.charArrayFromString(data).reverse())
            this.__insert(line, idx, c, bidxArr);
        
        let deleteCsr = [null, null];
        this.fromByteIdx(deleteBidx, deleteCsr);

        for (let i = 0; i < delsize; i++)
            this.__del(...deleteCsr, bidxArr);
    }

    toByteIdx(crs)
    {
        let idx = 0;
        for (let i = 0; i < crs[0]; i++) idx += 1 + this.lines[i].length; idx += crs[1];
        return idx;
    }
    fromByteIdx(idx, csr)
    {
        let line = 0;
        for (let i = 0; i < this.lines.length; i++)
            if (idx >= this.lines[i].length + 1)
            {
                idx -= this.lines[i].length + 1;
                line += 1;
            }
            else
                break;
        csr[0] = line; csr[1] = idx;
    }

    getRawBytes(idxs)
    {
        let rawBytes = [];

        if (idxs == null)
        {
            for (let line of this.lines)
            {
                for (let ci of line)
                    rawBytes.push(ci);
                rawBytes.push('\n'.charCodeAt(0));
            }
            rawBytes.pop();
        }
        else
        {
            let s = idxs[0], e = idxs[1], l = null;

            for (l = 0; l < this.lines.length; l++)
                if (s >= this.lines[l].length + 1)
                {
                    s -= this.lines[l].length + 1;
                    e -= this.lines[l].length + 1;
                }
                else
                    break;
            
            while (l < this.lines.length && e > 0)
            {
                let grab = this.lines[l].slice(s, e);
                e -= s + grab.length; s -= s; if (e > 0) e -= 1, grab.push('\n'.charCodeAt(0));
                rawBytes.push(...grab);
                l += 1;
            }
        }

        return rawBytes;
    }
}

config.textMgrs = {};
config.textMgrsByPath = {};
