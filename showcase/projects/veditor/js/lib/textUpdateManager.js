config.libTextUpdateManager = {};

config.libTextUpdateManager.CLASS = class
{
    constructor (textMgr, operation, args, csr)
    {
        this.textMgr = textMgr;
        this.operation = operation;
        this.line = args[0];
        this.idx = args[1];
        this.char = args[2];
        this.csr = csr;

        this.queue = []; this.queue.push([textMgr, operation, args]);
        this.trail = {};
        this.last = {};

        this.__processQueue();
    }

    __processItem(itemIdx, item)
    {
        if (itemIdx > 1000) throw ("LONG: TOO MUCH WORK !");
        let textMgr = item[0], operation = item[1], args = item[2];

        if (typeof operation == 'object')
        {
            if (this.last[operation.to] > itemIdx) return;

            let to = operation.to.split('@'); to = config.bindRegions[to[1]][to[0]];
            let from = operation.from; from = from.map(
                function (f)
                {
                    f = f.split('@');
                    f = config.bindRegions[f[1]][f[0]];
                    f = f.getCurrent();
                    return f;
                }  
            );

            textMgr = config.textMgrsByPath[to.path];
            let updateBidx = to.selection;
            let bidxArr = [];
            bidxArr.push(textMgr.toByteIdx(to.path == this.textMgr.path ? this.csr : [0, 0]));
            let updateDetails = {}; updateDetails.type = 'BIND'; updateDetails.bind = operation;

            let affectedBindRegions = [];
            let allBindRegions = [];
            if (config.bindRegions[textMgr.path] != null)
                for (let br of Object.keys(config.bindRegions[textMgr.path]).sort())
                {
                    br = config.bindRegions[textMgr.path][br];
                    allBindRegions.push(br); bidxArr.push(...br.selection);
                    if (br.isAffected(updateBidx))
                        affectedBindRegions.push(br);
                }
            
            let canUpdate = true;
            for (let br of affectedBindRegions)
            {
                let intercept = br.fAtmt(updateDetails, br.getCurrent(), this.trail, br);

                canUpdate = canUpdate && (intercept.startsWith('ALLOW'));
                if (intercept.startsWith('RAISE')) console.log('BindRegion: ', br.name, br.path, intercept);
            }
            if (! canUpdate) return;

            let data = operation.int(from, to.getCurrent(), this.trail, to);
            let delsize = updateBidx[1] - updateBidx[0];
            let updateCsr = [null, null]; textMgr.fromByteIdx(updateBidx[0], updateCsr);
            
            textMgr.__bulk(...updateCsr, delsize, data, bidxArr);

            if (to.path == this.textMgr.path) textMgr.fromByteIdx(bidxArr[0], this.csr);
            for (let i = 0; i < allBindRegions.length; i++)
                allBindRegions[i].selection[0] = bidxArr[1+2*i], allBindRegions[i].selection[1] = bidxArr[2+2*i];

            for (let br of affectedBindRegions)
            {
                let intercept = br.fCmpl(updateDetails, br.currentValue, br.getCurrent(), this.trail, br);

                if (intercept == 'PROPAGATE')
                {
                    let startSig = br.name + '@' + br.path;
                    if (config.bindRegionsImpact[startSig] != null)
                        for (let k of Object.keys(config.bindRegionsImpact[startSig]))
                            this.last[config.binds[k].to] = this.queue.length, this.queue.push([null, config.binds[k], null]);
                }
            }

            return true;
        }
        else
        {
            let line = args[0], idx = args[1], c = args[2];
            let updateBidx = textMgr.toByteIdx([line, idx]);
            let bidxArr = [];
            bidxArr.push(textMgr.toByteIdx(this.csr));
            let updateSize = null;

            switch (operation)
            {
                case 'INSERT':
                    updateSize = 1;
                    break;

                case 'DELETE':
                    updateSize = 1;
                    break;

                case 'PASTE':
                    updateSize = 1;
                    break;

                case 'MASSDELETE':
                    updateSize = args[3];
                    break;
            }
            
            let updateDetails = {}; updateDetails.type = operation; updateDetails.char = c; updateDetails.loc = updateBidx; updateDetails.size = updateSize;

            let affectedBindRegions = [];
            let allBindRegions = [];
            if (config.bindRegions[textMgr.path] != null)
                for (let br of Object.keys(config.bindRegions[textMgr.path]).sort())
                {
                    br = config.bindRegions[textMgr.path][br];
                    allBindRegions.push(br); bidxArr.push(...br.selection);
                    if (br.isAffected([updateBidx, updateBidx + updateSize]))
                        affectedBindRegions.push(br);
                }
            
            let canUpdate = true;
            for (let br of affectedBindRegions)
            {
                let intercept = br.fAtmt(updateDetails, br.getCurrent(), this.trail, br);

                canUpdate = canUpdate && (intercept.startsWith('ALLOW'));
                if (intercept.startsWith('RAISE')) console.log('BindRegion: ', br.name, br.path, intercept);
            }
            if (! canUpdate) return;
            
            switch (operation)
            {
                case 'INSERT':
                {
                    textMgr.__insert(line, idx, c, bidxArr);
                }
                break;

                case 'DELETE':
                {
                    textMgr.__del(line, idx, bidxArr);
                }
                break;

                case 'PASTE':
                {
                    textMgr.__bulk(line, idx, args[3], c, bidxArr);
                }
                break;

                case 'MASSDELETE':
                {
                    textMgr.__bulk(line, idx, args[3], '', bidxArr);
                }
                break;
            }

            textMgr.fromByteIdx(bidxArr[0], this.csr);
            for (let i = 0; i < allBindRegions.length; i++)
                allBindRegions[i].selection[0] = bidxArr[1+2*i], allBindRegions[i].selection[1] = bidxArr[2+2*i];

            for (let br of affectedBindRegions)
            {
                let intercept = br.fCmpl(updateDetails, br.currentValue, br.getCurrent(), this.trail, br);

                if (intercept == 'PROPAGATE')
                {
                    let startSig = br.name + '@' + br.path;
                    if (config.bindRegionsImpact[startSig] != null)
                        for (let k of Object.keys(config.bindRegionsImpact[startSig]))
                            this.last[config.binds[k].to] = this.queue.length, this.queue.push([null, config.binds[k], null]);
                }
            }

            return true;
        }
    }
    __processQueue()
    {
        for (let i = 0; i < this.queue.length; i++)
            this.__processItem(i, this.queue[i]);
    }
}