# DT Packager for FHIR

This uses the [FHIR Codegen
project](https://github.com/microsoft/fhir-codegen), preparing for submission
to [DT](https://github.com/DefinitelyTyped/DefinitelyTyped).

Here are the tasks, in roughly an order that could be used to update new DT
package:

---

Clean all local temp files
```
> gulp clean
```

Download and unzip the FHIR R2, R3, and R4 spec. There are some warnings, as
the spec has some invalid path names, e.g. "appears to use backslashes as path
separators". This is safe to ignore.
```
> gulp download
```

Run the FHIR Codegen project. Need to make sure to git checkout the submodule,
and have dotnet installed locally for this to work:
```
> gulp fhirCodegen
```

Create R2, R3, and R4 versions in the `types` directory:
```
> gulp version
```

Create the DT index and other required files:
```
> gulp createIndex
```

Run the DT tests:
```
> gulp test
```

In the end, the output of `./types` should be ready to structure into a PR for
the DT project.
