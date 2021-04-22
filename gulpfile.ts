import gulp, { parallel } from  'gulp'
import del from 'del'
import fs from 'fs'
import wget from 'wget-improved'
import { exec } from 'child_process'
import exceptions from './exceptions'

// Utils...
const removeKeys = (obj: object, keys: string[]) : {} => obj !== Object(obj)
  ? obj
  : Array.isArray(obj)
  ? obj.map((item) => removeKeys(item, keys))
  : Object.keys(obj)
  .filter((k) => !keys.includes(k))
  .reduce(
    (acc, x) => Object.assign(acc, { [x]: removeKeys((obj as any)[x], keys) }),
    {}
  )

const cleanEmpty = function (object: {}) {
  for (let [k, v] of Object.entries(object)) {
    if (v && typeof v === 'object')
      cleanEmpty(v)

    if (v &&
      typeof v === 'object' &&
      !Object.keys(v).length ||
      v === null ||
      v === undefined
    ) {
      if (k.startsWith('_')) {
        if (Array.isArray(object))
          object.splice(Number(k), 1)
        else if (!(v instanceof Date))
          delete (object as any)[k]
      }
    }
  };
  return object;
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
  execute(`unzip -o ${out} -d ${outDir}`, cb)
}

const doNotSkip = (file: string, specDir: string): boolean => {
  const version = specDir.slice(-7, -5)
  return ! (exceptions as any)[version]?.includes(file)
}

const download = (url: string, dest: string, cb: Function) => {
  console.log(`* Downloading ${url} to ${dest}...`)
  /*
  wget.download(url, output)
    .on('error', (err) => console.log(err))
    .on('end', (out) => {
      unzip(output)
      cb()
    })
  */
  // unzip(dest, cb)
  cb()
}

export const buildExamples = (specDir: string, outputDir: string, cb: Function) => {
  console.log(`* Reading from ${specDir}...`)
  fs.readdir(specDir, (err, files) => {
    if (err) {
      console.error(err)
      throw(err)
    }
    const testFile = [
      "import * as fhir from './index';",
    ] as string[]
    files?.forEach((file, i) => {
      if (
        file.endsWith('json') &&
        file.includes('example') &&
        doNotSkip(file, specDir)
        ) {
        const buf = fs.readFileSync(`${specDir}/${file}`)
        const content = buf.toString()
        try {
          const resource = JSON.parse(content)
          const { resourceType } = resource
          delete resource.text
          const resourceWoComments = cleanEmpty(removeKeys(resource, [ 'fhir_comments' ]))

          testFile.push('')
          testFile.push(`// ${file}`)
          testFile.push(`const test${i}: fhir.${resourceType} = ${JSON.stringify(resourceWoComments)};`)
        } catch(e) {
          console.error(`error with ${file}`, e)
        }
      }
    })

    testFile.push('') // tslint wants an extra line

    console.log(`* Writing to ${outputDir}/fhir-test.ts...`)
    fs.writeFile(`${outputDir}/fhir-tests.ts`, testFile.join("\n"), (err) => {
      if (err) throw err
      cb()
    })
  })
}

export const copyTs = (version: string, cb: Function) => {
  const src = `${__dirname}/fhir-codegen/generated/TypeScript_${version.toUpperCase()}.ts`
  const dest = `${__dirname}/types/${version}/index.d.ts`

  const header = `// Type definitions for FHIR ${version.slice(1)}.0
// Project: http://hl7.org/fhir/index.html
// Definitions by: Artifact Health <https://github.com/meirgottlieb>
//                 Jan Huenges <https://github.com/jhuenges>
//                 Brian Kaney <https://github.com/bkaney>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTypes
//
// Generated from https://github.com/microsoft/fhir-codegen, packaged
// with https://github.com/vermonster/fhir-dt-generator.
//

`

  console.log(`* Extracting ${src} to ${dest}, adding header, and removing trailing whitespaces...`)
  execute(`echo '${header}' | cat - ${src} > ${dest} && sed -i 's/[[:space:]]*$//' ${dest}`, cb)
}

export const createR2 = (cb: Function) => {
  const specDir = `${__dirname}/spec`
  const testDir = `${__dirname}/types/r2`
  download('http://hl7.org/fhir/DSTU2/fhir-spec.zip', `${specDir}/r2.zip`, () => {
    buildExamples(`${specDir}/r2/site`, testDir, () => {
      copyTs('r2', cb)
    })
  })
}

export const clean = () => del([ 'build', 'examples' ])
export const mkdir = (cb: Function) => {
  fs.mkdirSync('examples')
  fs.mkdirSync('build/r2', {recursive: true})
  fs.mkdirSync('build/r3', {recursive: true})
  fs.mkdirSync('build/r4', {recursive: true})
  fs.mkdirSync('build/r5', {recursive: true})
  cb()
}

// const build = gulp.series(clean, mkdir, parallel(download_2, download_3, download_4))
// export default gulp.series(clean, mkdir, createR2Examples)
export default gulp.series(createR2)
