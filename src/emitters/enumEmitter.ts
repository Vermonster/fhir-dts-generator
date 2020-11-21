/// <reference path="../types.d.ts" />

import util = require("util");
import path = require("path");
import Writer = require("../writer");

function emitFiles(outDir: string, types: Type[]): EmitResults {

    var currentFile: string;

    var result: EmitResults = {
        errors: []
    }

    var writer = new Writer(path.join(outDir, "valueSets.ts"));

    types.forEach(type => {

        if(!(type.kind & TypeKind.RootTypes)) {
            addError("Expected root type instead of '%d'.", type.kind);
            return;
        }

        if(!type.name) {
            addError("Type missing name.");
            return;
        }

        emitType(type);
    });

    writer.close();
    return result;


    function addError(message: string, ...args: any[]) {

        var msg = util.format.apply(this, arguments);
        if(currentFile) {
            msg = currentFile + ": " + msg;
        }
        result.errors.push(msg);
    }

    function emitType(type: Type): void {
        switch(type.kind) {

            case TypeKind.TypeReference:
                break;
            case TypeKind.ObjectType:
                break;
            case TypeKind.InterfaceType:
                break;
            case TypeKind.EnumType:
                emitEnumType(<EnumType>type);
                break;
            case TypeKind.ArrayType:
                break;
            case TypeKind.UnionType:
                break;
            case TypeKind.Primitive:
                break;
            default:
                addError("Cannot emit unknown type %d", type.kind);
        }
    }

    function emitComment(text: string): void {

        if(!text) return;

        var lines = text.split("\n");

        writer.write("/**");
        writer.writeLine();

        lines.forEach(line => {
            writer.write(" * " + line);
            writer.writeLine();
        });

        writer.write(" */");
        writer.writeLine();
    }

    function emitEnumType(enumType: EnumType): void {

        emitComment(enumType.description);

        writer.write("export enum ");
        writer.write(enumType.name);
        writer.write(" {");
        writer.writeLine();
        writer.writeLine();
        writer.increaseIndent();

        for(var i = 0; i < enumType.members.length; i++) {

            emitEnumMember(enumType.members[i]);

            if(i != enumType.members.length - 1) {
                writer.write(",");
            }
            writer.writeLine();
        }

        writer.decreaseIndent();
        writer.write("}");
        writer.writeLine();
    }

    function emitEnumMember(member: EnumMember): void {

        emitComment(member.description);
        writer.write(member.name);
        writer.write(" = ");
        writer.write("\"");
        writer.write(member.value);
        writer.write("\"");
    }
}

export = emitFiles;
