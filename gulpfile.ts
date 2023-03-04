import gulp from 'gulp'
import fs from 'fs'
import wget from 'wget-improved'
import { exec } from 'child_process'
import exceptions from './exceptions'

// Utils...
const removeKeys = (obj: object, keys: string[]): {} =>
  obj !== Object(obj)
    ? obj
    : Array.isArray(obj)
    ? obj.map((item) => removeKeys(item, keys))
    : Object.keys(obj)
        .filter((k) => !keys.includes(k))
        .reduce(
          (acc, x) =>
            Object.assign(acc, { [x]: removeKeys((obj as any)[x], keys) }),
          {}
        )

const cleanEmpty = function (object: {}) {
  for (let [k, v] of Object.entries(object)) {
    if (v && typeof v === 'object') cleanEmpty(v)

    if (
      (v && typeof v === 'object' && !Object.keys(v).length) ||
      v === null ||
      v === undefined
    ) {
      if (k.startsWith('_')) {
        if (Array.isArray(object)) object.splice(Number(k), 1)
        else if (!(v instanceof Date)) delete (object as any)[k]
      }
    }
  }
  return object
}

const execute = (command: string, cb: Function) => {
  exec(command, { maxBuffer: 1024 * 5000 }, (error, _stdout, stderr) => {
    if (error) {
      console.error(`warn: ${error.message}`)
    }
    if (stderr) {
      console.error(`warn: ${stderr}`)
    }
    cb()
  })
}

const unzip = (out: string, cb: Function) => {
  const outDir = out.replace(/(.*)\.zip$/, '$1')
  console.log(`* Extracting ${out} to ${outDir}...`)

  let extra = ''
  if (out.endsWith('4.zip')) {
    extra = `; mv ${outDir}/examples-json/*.json ${outDir}`
  } else if (out.endsWith('r3.zip')) {
    extra = `; mv ${outDir}/site/*.json ${outDir}`
  }

  execute(`unzip -o ${out} -d ${outDir}${extra}`, cb)
}

const untar = (out: string, cb: Function) => {
  const outDir = out.replace(/(.*)\.tgz$/, '$1')
  console.log(`* Extracting ${out} to ${outDir}...`)
  execute(
    `mkdir -p ${outDir} && tar -zxvf ${out} -C ${outDir} && mv ${outDir}/package/* ${outDir}`,
    cb
  )
}

// True if it is in the skip list
const doNotSkip = (file: string, specDir: string): boolean => {
  const version = specDir.replace(/.*\/(r[0-9b]*)$/, '$1')
  console.log('version', version)
  const noSkip = !(exceptions as any)[version]?.includes(file)
  return noSkip
}

const seenTests: string[] = []

const testExistsForType = (file: string, specDir: string): boolean => {
  if (doNotSkip(file, specDir)) {
    const buf = fs.readFileSync(`${specDir}/${file}`)
    const content = buf.toString()

    const resource = JSON.parse(content)
    const { resourceType } = resource
    const key = specDir + resourceType

    console.log('seen', key)
    if (seenTests.includes(key)) {
      return true
    }
    seenTests.push(key)
    return false
  }
  return false
}

const download = (url: string, dest: string, cb: Function) => {
  console.log(`* Downloading ${url} to ${dest}...`)
  wget
    .download(url, dest)
    .on('error', (err) => console.log(err))
    .on('end', (out) => {
      console.log(`* ${out}`)
      if (dest.endsWith('zip')) {
        unzip(dest, cb)
      }
      if (dest.endsWith('tgz')) {
        untar(dest, cb)
      }
    })
}

const buildExamples = (specDir: string, version: string, cb: Function) => {
  console.log(`* Reading from ${specDir}...`)
  fs.readdir(specDir, (err, files) => {
    if (err) {
      console.error(err)
      throw err
    }
    const testFile = [] as string[]
    files?.forEach((file, i) => {
      if (
        file.endsWith('.json') &&
        file.includes('example') &&
        !file.includes('diff') &&
        doNotSkip(file, specDir) &&
        !testExistsForType(file, specDir)
      ) {
        try {
          const buf = fs.readFileSync(`${specDir}/${file}`)
          const content = buf.toString()

          const resource = JSON.parse(content)
          const { resourceType } = resource
          delete resource.text
          const resourceWoComments = cleanEmpty(
            removeKeys(resource, ['fhir_comments'])
          )

          testFile.push('')
          testFile.push(`// ${file}`)
          testFile.push(
            `const ${version}Test${i}: fhi${version}.${resourceType} = ${JSON.stringify(
              resourceWoComments
            )};`
          )
        } catch (e) {
          console.error(`error with ${specDir}/${file}`, e)
        }
      }
    })

    testFile.push('') // tslint wants an extra line

    const testFilename = `${__dirname}/types/fhir/test/${version}-tests.ts`
    console.log(`* Writing to ${testFilename}...`)
    fs.writeFile(testFilename, testFile.join('\n'), (err) => {
      if (err) throw err
      cb()
    })
  })
}

const copyTs = (version: string, cb: Function) => {
  const src = `${__dirname}/fhir-codegen/generated/TypeScript_${version.toUpperCase()}.ts`
  const dest = `${__dirname}/types/fhir/${version}.d.ts`

  const header = `export as namespace fhi${version};`

  console.log(
    `* Extracting ${src} to ${dest}, adding header, and removing trailing whitespaces...`
  )
  execute(
    `echo '${header}' | cat - ${src} > ${dest} && sed -i 's/[[:space:]]*$//' ${dest}`,
    cb
  )
}

const copyTemplates = (dest: string, cb: Function) => {
  console.log(`* Copying ts JSON templates...`)
  execute(`cp ${__dirname}/templates/*.json ${dest}`, cb)
}

export const createIndex = (cb: Function) => {
  const header = `// Type definitions for non-npm package FHIR
// Project: http://hl7.org/fhir/index.html
// Definitions by: Artifact Health <https://github.com/meirgottlieb>
//                 Jan Huenges <https://github.com/jhuenges>
//                 Brian Kaney <https://github.com/bkaney>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTypes
// Minimum TypeScript Version: 4.3

// Generated from https://github.com/microsoft/fhir-codegen, packaged
// with https://github.com/vermonster/fhir-dt-generator.

/// <reference path="r2.d.ts" />
/// <reference path="r3.d.ts" />
/// <reference path="r4.d.ts" />
/// <reference path="r4b.d.ts" />
/// <reference path="r5.d.ts" />
`

  execute(`echo '${header}' > types/fhir/index.d.ts`, () => {
    copyTemplates(`${__dirname}/types/fhir`, cb)
  })
}

export const createVersion = (version: string, cb: Function) => {
  const specDir = `${__dirname}/spec`
  buildExamples(`${specDir}/${version}`, version, () => {
    copyTs(version, cb)
  })
}

export const createR2 = (cb: Function) => {
  createVersion('r2', cb)
}
export const createR3 = (cb: Function) => {
  createVersion('r3', cb)
}
export const createR4 = (cb: Function) => {
  createVersion('r4', cb)
}
export const createR4b = (cb: Function) => {
  createVersion('r4b', cb)
}
export const createR5 = (cb: Function) => {
  createVersion('r5', cb)
}

// Examples
export const downloadR2 = (cb: Function) => {
  const specDir = `${__dirname}/spec`
  const url = 'http://hl7.org/fhir/DSTU2/examples-json.zip'
  download(url, `${specDir}/r2.zip`, cb)
}

// NOTE: We need the whole spec here, the examples download for R3 seems broken?
export const downloadR3 = (cb: Function) => {
  const specDir = `${__dirname}/spec`
  //const url = 'http://hl7.org/fhir/STU3/examples-json.zip'
  const url = 'http://hl7.org/fhir/STU3/fhir-spec.zip'
  download(url, `${specDir}/r3.zip`, cb)
}

export const downloadR4 = (cb: Function) => {
  const specDir = `${__dirname}/spec`
  const url = 'http://hl7.org/fhir/R4/examples-json.zip'
  download(url, `${specDir}/r4.zip`, cb)
}

export const downloadR4b = (cb: Function) => {
  const specDir = `${__dirname}/spec`
  const url = 'http://hl7.org/fhir/examples-json.zip'
  download(url, `${specDir}/r4b.zip`, cb)
}

export const downloadR5 = (cb: Function) => {
  const specDir = `${__dirname}/spec`
  const url = 'http://hl7.org/fhir/5.0.0-ballot/examples-json.zip'
  download(url, `${specDir}/r5.zip`, cb)
}

export const mkdir = (cb: Function) => {
  if (!fs.existsSync('spec')) {
    fs.mkdirSync('spec')
  }
  if (!fs.existsSync('types/fhir/test')) {
    fs.mkdirSync('types/fhir/test', { recursive: true })
  }
  cb()
}

export const test = (cb: Function) => {
  execute('npx dtslint ./types/fhir', cb)
}

export const runCodegen = (cb: Function) => {
  execute(
    'cd ./fhir-codegen && \
    dotnet build && \
    dotnet src/fhir-codegen-cli/bin/Debug/net6.0/fhir-codegen-cli.dll --load-r2 latest --load-r3 latest --load-r4 latest --load-r4b 4.3.0 --official-expansions-only true --export-types "primitive|complex|resource" --verbose true --language TypeScript && \
    dotnet src/fhir-codegen-cli/bin/Debug/net6.0/fhir-codegen-cli.dll --load-r5 latest --experimental true --official-expansions-only true --export-types "primitive|complex|resource" --verbose true --language TypeScript',
    cb
  )
}

export const prepare = gulp.series(mkdir)

export const dowloadExamples = gulp.parallel(
  downloadR2,
  downloadR3,
  downloadR4,
  downloadR4b,
  downloadR5
)

export const createVersions = gulp.series(
  createR2,
  createR3,
  createR4,
  createR4b,
  createR5
)
