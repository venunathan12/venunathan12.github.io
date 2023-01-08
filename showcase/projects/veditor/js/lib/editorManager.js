config.libEditorManager = {};

config.libEditorManager.CLASS = class
{
    constructor (editorId)
    {
        this.editorId = editorId;
        this.textMgr = new config.libTextManager.CLASS(editorId);

        this.lcursor = null;
        this.rcursor = null;
        this.mode = 'D';
    }

    __validateNode(node)
    {
        while (node != null && node.nodeName != 'BODY' && node.id != 'subDataMidRight_Editors' && node.parentNode != null)
        {
            if (node.id == this.editorId)
                return true;
            node = node.parentNode;
        }
        return false;
    }

    renderFull()
    {
        this.mode = 'D';
        let tag = document.getElementById(this.editorId);
        let lntag = document.getElementById('subDataMidLeft'), ln = 0;
        if (tag == null) return;

        // TODO
        tag.innerHTML = ''; lntag.innerHTML = '';
        let newTagHTML = '', newLineHTML = '';
        for (let line of this.textMgr.lines)
        {
            newTagHTML += "<pre>" + config.libStringOps.stringFromCharCodeArray(line).replace(/</g, '&lt;').replace(/>/g, '&gt;') + "</pre><br>";
            newLineHTML +=  (line.length > 0 ? "<pre>" + (ln + 1) + "</pre>" : '') + "<br>"; ln ++;
        }
        tag.innerHTML = newTagHTML, lntag.innerHTML = newLineHTML;
    }

    visualiseRegionsFull()
    {
        this.mode = 'BR';
        let tag = document.getElementById(this.editorId);
        let lntag = document.getElementById('subDataMidLeft'), ln = 0, sbIdx = 0;
        if (tag == null) return;

        let rawBytes = this.textMgr.getRawBytes();
        let prixArr = [];
        for (let i = 0; i < rawBytes.length; i++) prixArr.push(0);
        if (config.bindRegions[this.textMgr.path] != null) for (let br of Object.values(config.bindRegions[this.textMgr.path])) prixArr[br.selection[0]] += 1, prixArr[br.selection[1]] -= 1;
        for (let i = 1; i < rawBytes.length; i++) prixArr[i] += prixArr[i-1];

        tag.innerHTML = ''; lntag.innerHTML = '';
        let newTagHTML = '', newLineHTML = '';
        for (let line of this.textMgr.lines)
        {
            newTagHTML += "<pre>" + prixArr.slice(sbIdx, sbIdx + line.length).map(weight => weight.toString(36)).join('') + "</pre><br>";
            newLineHTML +=  (line.length > 0 ? "<pre>" + (ln + 1) + "</pre>" : '') + "<br>";
            ln ++; sbIdx += line.length + 1;
        }
        tag.innerHTML = newTagHTML, lntag.innerHTML = newLineHTML;
    }

    getWindowSelection()
    {
        let selection = window.getSelection();
        let lEndNode = selection.baseNode, lEndId = selection.baseOffset;
        let rEndNode = selection.extentNode, rEndId = selection.extentOffset;

        if (this.textMgr.lines.length == 1 && this.textMgr.lines[0].length == 0)
            return [0, 0, 0, 0];
        if(! (this.__validateNode(lEndNode) && this.__validateNode(rEndNode) && this.mode == 'D'))
            return [null, null, null, null];
        

        let lc_line = null, lc_id = null, rc_line = null, rc_id = null;

        if (lEndNode.id == this.editorId)
        {
            lc_line = 0;
            while (2 + 2 * lc_line < lEndId) lc_line += 1;
            lc_id = this.textMgr.lines.at(lc_line).length;
        }
        else
        {
            lEndNode = lEndNode.parentNode;
            let lineNodes = lEndNode.parentNode.childNodes;
            lc_line = 0;
            for (let lineNode of lineNodes)
            {
                if (lineNode.nodeName == 'BR') continue;
                if (lineNode == lEndNode) break;
                lc_line += 1;
            }
            lc_id = lEndId;
        }

        if (rEndNode.id == this.editorId)
        {
            rc_line = 0;
            while (2 + 2 * rc_line < rEndId) rc_line += 1;
            rc_id = this.textMgr.lines.at(rc_line).length;
        }
        else
        {
            rEndNode = rEndNode.parentNode;
            let lineNodes = rEndNode.parentNode.childNodes;
            rc_line = 0;
            for (let lineNode of lineNodes)
            {
                if (lineNode.nodeName == 'BR') continue;
                if (lineNode == rEndNode) break;
                rc_line += 1;
            }
            rc_id = rEndId;
        }

        return [lc_line, lc_id, rc_line, rc_id];
    }

    mouseupEvent(tag, event)
    {
        if (this.mode != 'D') return;

        let currWindowSelection = this.getWindowSelection();

        this.lcursor = [currWindowSelection[0], currWindowSelection[1]];
        this.rcursor = [currWindowSelection[2], currWindowSelection[3]];

        let sels = document.getElementById('subDataBotRightSelectionStart');
        let sele = document.getElementById('subDataBotRightSelectionEnd');
        let sell = document.getElementById('subDataBotRightSelectionLength');
        let selsB = null, seleB = null;

        if (currWindowSelection[0] == null || currWindowSelection[1] == null || currWindowSelection[2] == null || currWindowSelection[3] == null)
            sels.innerHTML = '',
            sele.innerHTML = '',
            sell.innerHTML = '0';
        else
            selsB = this.textMgr.toByteIdx(this.lcursor),
            seleB = this.textMgr.toByteIdx(this.rcursor),
            sels.innerHTML = `Line ${this.lcursor[0] + 1} Column ${this.lcursor[1] + 1}`,
            sele.innerHTML = `Line ${this.rcursor[0] + 1} Column ${this.rcursor[1] + 1}`,
            sell.innerHTML = seleB >= selsB ? seleB - selsB : selsB - seleB,
            [this.lcursor, this.rcursor] = seleB >= selsB ? [this.lcursor, this.rcursor] : [this.rcursor, this.lcursor];
    }
    keydownEvent(tag, event)
    {
        if (this.mode != 'D') return;
        if (['Control', 'Alt', 'Shift', 'CapsLock', 'Tab', 'Home', 'End'].includes(event.key)) return;
        if (this.lcursor[0] == null || this.rcursor[0] == null || this.lcursor[1] == null || this.rcursor[1] == null) return;

        if (this.lcursor[0] == this.rcursor[0] && this.lcursor[1] == this.rcursor[1])
        {
            let cursor = [this.lcursor[0], this.lcursor[1]];

            if (event.ctrlKey)
            {
                return;
            }
            else if (['Enter', 'Backspace', 'Delete'].includes(event.key))
            {
                switch (event.key)
                {
                    case 'Enter':
                    {
                        new config.libTextUpdateManager.CLASS(this.textMgr, 'INSERT', [...this.lcursor, '\n'], cursor);
                    }
                    break;

                    case 'Backspace':
                    {
                        if (this.lcursor[1] > 0)
                        {
                            this.lcursor[1] -= 1; this.rcursor[1] -= 1;
                        }
                        else if (this.lcursor[0] > 0)
                        {
                            this.lcursor[0] -= 1; this.rcursor[0] -= 1;
                            this.lcursor[1] = this.textMgr.lines[this.lcursor[0]].length; this.rcursor[1] = this.lcursor[1];
                        }
                        else
                            break;
                        
                        if (this.lcursor[1] < this.textMgr.lines[this.lcursor[0]].length || this.lcursor[0] < this.textMgr.lines.length)
                        {
                            new config.libTextUpdateManager.CLASS(this.textMgr, 'DELETE', [...this.lcursor], cursor);
                        }
                    }
                    break;

                    case 'Delete':
                    {
                        new config.libTextUpdateManager.CLASS(this.textMgr, 'DELETE', [...this.lcursor], cursor);
                    }
                    break;
                }
            }
            else if (event.key.length == 1 && event.key.charCodeAt(0) >= 32 && event.key.charCodeAt(0) <= 126)
            {
                new config.libTextUpdateManager.CLASS(this.textMgr, 'INSERT', [...this.lcursor, event.key], cursor);
                event.preventDefault();
            }

            this.lcursor[0] = cursor[0]; this.lcursor[1] = cursor[1];
            this.rcursor[0] = cursor[0]; this.rcursor[1] = cursor[1];

            // TODO: Optimise
            this.renderFull();
        }
        else
        {
            // TODO

            let cursor = [this.lcursor[0], this.lcursor[1]];
            let sBi = this.textMgr.toByteIdx(this.lcursor), eBi = this.textMgr.toByteIdx(this.rcursor);

            if (event.ctrlKey)
            {
                return;
            }
            else if (['Backspace', 'Delete'].includes(event.key))
            {
                switch (event.key)
                {
                    case 'Backspace':
                    {
                        new config.libTextUpdateManager.CLASS(this.textMgr, 'MASSDELETE', [...this.lcursor, null, eBi - sBi], cursor);
                    }
                    break;

                    case 'Delete':
                    {
                        new config.libTextUpdateManager.CLASS(this.textMgr, 'MASSDELETE', [...this.lcursor, null, eBi - sBi], cursor);
                    }
                    break;
                }
            }

            this.lcursor[0] = cursor[0]; this.lcursor[1] = cursor[1];
            this.rcursor[0] = cursor[0]; this.rcursor[1] = cursor[1];

            // TODO: Optimise
            this.renderFull();
        }
    }
    pasteEvent(tag, event)
    {
        if (this.mode != 'D') return;

        let pasteString = event.clipboardData.getData('Text');
        pasteString = pasteString.replaceAll('\r', '');

        if (this.lcursor[0] == this.rcursor[0] && this.lcursor[1] == this.rcursor[1])
        {
            let cursor = [this.lcursor[0], this.lcursor[1]];
            
            new config.libTextUpdateManager.CLASS(this.textMgr, 'PASTE', [...this.lcursor, pasteString, 0], cursor);

            this.lcursor[0] = cursor[0]; this.lcursor[1] = cursor[1];
            this.rcursor[0] = cursor[0]; this.rcursor[1] = cursor[1];

            // TODO: Optimise
            this.renderFull();
        }
        else
        {
            let cursor = [this.lcursor[0], this.lcursor[1]];
            let sBi = this.textMgr.toByteIdx(this.lcursor), eBi = this.textMgr.toByteIdx(this.rcursor);
            
            new config.libTextUpdateManager.CLASS(this.textMgr, 'PASTE', [...this.lcursor, pasteString, eBi - sBi], cursor);

            this.lcursor[0] = cursor[0]; this.lcursor[1] = cursor[1];
            this.rcursor[0] = cursor[0]; this.rcursor[1] = cursor[1];

            // TODO: Optimise
            this.renderFull();
        }
    }
    editorCloseEvent()
    {
        let pathStr = config.textMgrs[this.editorId].path;
        let currObj = {items: config.projDirectory};
        for (let dir of pathStr.split('/'))
            currObj = currObj.items[dir];        
        currObj.editorId = null;

        delete config.editors[this.editorId];
        delete config.textMgrs[this.editorId];
    }
    switchModeEvent(mode)
    {
        this.mode = mode;

        switch (this.mode)
        {
            case 'D':
            {
                this.renderFull();
            }
            break;

            case 'BR':
            {
                this.visualiseRegionsFull();
            }
            break;
        }
    }
}

config.editors = {};
