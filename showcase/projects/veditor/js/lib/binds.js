config.libBinds = {};

config.libBinds.BINDREGION_CLASS = class
{
    constructor (ID, name, selectionLong, fAtmtS, fCmplS)
    {
        this.editorId = (ID != null && !ID.startsWith('./')) ? ID : null;
        this.path = this.editorId != null ? config.editors[this.editorId].textMgr.path : ID;
        this.name = name;
        this.selection = this.path != null ? [config.textMgrsByPath[this.path].toByteIdx(selectionLong.slice(0,2)), config.textMgrsByPath[this.path].toByteIdx(selectionLong.slice(2,4))] : [null, null];
        this.fAtmtS = fAtmtS;
        this.fCmplS = fCmplS;
        this.previousValue = null;
        this.currentValue = null;

        eval('this.fAtmt = ' + this.fAtmtS);
        eval('this.fCmpl = ' + this.fCmplS);
        if (this.selection != null) if (this.selection[0] > this.selection[1]) this.selection = [this.selection[1], this.selection[0]];
    }
    __recompileLogic()
    {
        eval('this.fAtmt = ' + this.fAtmtS);
        eval('this.fCmpl = ' + this.fCmplS);
    }

    isAffected(range)
    {
        return range[1] > this.selection[0] && range[0] < this.selection[1];
    }

    addRegion()
    {
        if (config.bindRegions[this.path] == null)
            config.bindRegions[this.path] = {};        
        config.bindRegions[this.path][this.name] = this;
        
        if (config.textMgrsByPath[this.path].META == null)
            config.textMgrsByPath[this.path].META = {};
        if (config.textMgrsByPath[this.path].META.bindRegions == null)
            config.textMgrsByPath[this.path].META.bindRegions = {};
        config.textMgrsByPath[this.path].META.bindRegions[this.name] = {details: this.toString(), selection: this.selection};
    }
    clearRegion()
    {
        delete config.bindRegions[this.path][this.name];
        delete config.textMgrsByPath[this.path].META.bindRegions[this.name];
    }
    setSelection(selectionNew)
    {
        this.selection[0] = selectionNew[0];
        this.selection[1] = selectionNew[1];
    }

    getSelectionLineIdx()
    {
        let st = [null, null], nd = [null, null];
        config.textMgrsByPath[this.path].fromByteIdx(this.selection[0], st);
        config.textMgrsByPath[this.path].fromByteIdx(this.selection[1], nd);
        return [st[0], st[1], nd[0], nd[1]];
    }

    toString()
    {
        let holderObj = {};
        holderObj.path = this.path;
        holderObj.name = this.name;
        holderObj.selection = this.selection;
        holderObj.fAtmtS = this.fAtmtS;
        holderObj.fCmplS = this.fCmplS;
        holderObj.previousValue = this.previousValue;
        return JSON.stringify(holderObj);
    }
    fromString(string)
    {
        let holderObj = JSON.parse(string);
        this.path = holderObj.path;
        this.name = holderObj.name;
        this.selection = holderObj.selection;
        this.fAtmtS = holderObj.fAtmtS;
        this.fCmplS = holderObj.fCmplS;
        this.previousValue = holderObj.previousValue;

        eval('this.fAtmt = ' + this.fAtmtS);
        eval('this.fCmpl = ' + this.fCmplS);
    }

    getCurrent()
    {
        if (this.currentValue != null) this.previousValue = this.currentValue;
        this.currentValue = config.libStringOps.stringFromCharCodeArray(config.textMgrsByPath[this.path].getRawBytes(this.selection));
        return this.currentValue;
    }
}

config.bindRegions = {}

config.libBinds.BIND_CLASS = class
{
    constructor (name, from, to, intS)
    {
        this.name = name;
        this.from = from;
        this.to = to;
        this.intS = intS;

        eval('this.int = ' + this.intS);
    }
    __recompileLogic()
    {
        eval('this.int = ' + this.intS);
    }

    addBind()
    {
        config.binds[this.name] = this;
        if (config.selectedProjectMeta.META.binds == null) config.selectedProjectMeta.META.binds = {};
        config.selectedProjectMeta.META.binds[this.name] = this.toString();

        for (let f of this.from)
        {
            if (config.bindRegionsImpact[f] == null) config.bindRegionsImpact[f] = {};
            config.bindRegionsImpact[f][this.name] = true;
        }
    }
    clearBind()
    {
        delete config.binds[this.name];
        delete config.selectedProjectMeta.META.binds[this.name];

        for (let f of this.from)
        {
            delete config.bindRegionsImpact[f][this.name];
            if (Object.keys(config.bindRegionsImpact[f]).length == 0) delete config.bindRegionsImpact[f];
        }
    }

    toString()
    {
        let holderObj = {};
        holderObj.name = this.name;
        holderObj.from = this.from;
        holderObj.to = this.to;
        holderObj.intS = this.intS;
        return JSON.stringify(holderObj);
    }
    fromString(string)
    {
        let holderObj = JSON.parse(string);
        this.name = holderObj.name;
        this.from = holderObj.from;
        this.to = holderObj.to;
        this.intS = holderObj.intS;

        eval('this.int = ' + this.intS);
    }
}

config.bindRegionsImpact = {}
config.binds = {}
