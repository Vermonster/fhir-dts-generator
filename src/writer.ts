import fs = require("fs");

class Writer {

    private _output = "";
    private _indent = 0;
    private _newLine = "\n";
    private _lineStart = true;
    private _indentStrings = ["", "    "];
    private _filename: string;

    constructor(filename: string) {

        this._filename = filename;
    }

    write(s: string): void {

        if(s && s.length) {
            if(this._lineStart) {
                this._output += this._getIndentString(this._indent);
                this._lineStart = false;
            }
            this._output += s;
        }
    }

    private _getIndentString(level: number) {

        if (this._indentStrings[level] === undefined) {
            this._indentStrings[level] = this._getIndentString(level - 1) + this._indentStrings[1];
        }
        return this._indentStrings[level];
    }

    writeLine(): void {

        if (!this._lineStart) {
            this._output += this._newLine;
            this._lineStart = true;

        }
    }

    increaseIndent(): void {

        this._indent++;
    }

    decreaseIndent(): void {

        this._indent--;
    }

    close(): void {
        fs.writeFileSync(this._filename, this._output, 'utf8');
    }
}

export = Writer;
