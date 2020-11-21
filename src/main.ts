/// <reference path="./types.d.ts" />

import fs = require("fs");
import path = require("path");
import mkdirp = require("mkdirp");
import glob = require("glob");

import reader = require("./reader");
import processor = require("./processor");
import emitter = require("./emitters/declartionEmitter");

var errors: string[];

var rootPath = path.dirname(__filename);
var specDir = path.resolve(rootPath, "../../specification/fhir-spec");
var outDir = path.resolve(rootPath, "../../out");

console.log("Loading specification in " + specDir);

mkdirp.sync(outDir);

var readerResult = reader.readSpecification(specDir);
errors = readerResult.errors;

if(errors.length == 0) {
    var processorResult = processor.processFiles(readerResult.files);
    errors = processorResult.errors;
}

if(errors.length == 0) {
    var emitResults = emitter(outDir, processorResult.types);
    errors = emitResults.errors;
}

reportErrors(errors);
createDeclarationTests(specDir, outDir);

process.exit(errors.length);

function reportErrors(errors: string[]): void {

    for(var i = 0; i < errors.length; i++) {
        console.log(errors[i]);
    }
}

function createDeclarationTests(specDir: string, outDir: string): void {
    var examples = "",
        count = 1;

    glob.sync(path.join(specDir, "**/*-example*.json")).forEach(filename => {
        // TODO: Make a file with regex of examples to ignore...
        // The SDC examples have lots of errors!
        if (
          filename.search(/sdc/gi) !== -1 ||
          filename.search(/examplescenario/gi) !== -1
        ) {
          return;
        }

        try {
          var example = JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
          if (example) {
            examples += "var example" + (count++) + ": fhir." + example.resourceType + " = " + JSON.stringify(example, null, "    ") + ";\n\n";
          }
        } catch(e) {
          console.error("error", filename);
          console.error(e)
        }
    });

    fs.writeFileSync(path.join(outDir, "fhir-tests.ts"), examples, 'utf8');
}
