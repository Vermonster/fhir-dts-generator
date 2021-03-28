import gulp, { parallel } from  'gulp'
import del from 'del'
import fs from 'fs'
import wget from 'wget-improved'
import { exec } from 'child_process'


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

const unzip = (out: string, cb: Function) => {
  const outDir = out.replace(/(.*)\.zip$/, '$1')
  console.log(`* Extracting ${out} to ${outDir}...`)
  exec(`unzip -o ${out} -d ${outDir}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
      return
    }
    console.log(`stdout: ${stdout}`)
    cb()
  })
}

const download = (url: string, output: string, cb: Function) => {
  console.log(`* Downloading ${url} to ${output}...`)
  /*  
  wget.download(url, output)
    .on('error', (err) => console.log(err))
    .on('end', (out) => {
      unzip(output)
      cb()
    })
  */
  unzip(output, cb)
}

export const buildExamples = (examplesDir: string, outputDir: string, cb: Function) => {
  console.log(`* Reading from ${examplesDir}...`)
  fs.readdir(examplesDir, (err, files) => {
    if (err) { 
      console.error(err)
      throw(err) 
    }
    const testFile = [
      "import * as fhir from './index';",
      "let dut;"
    ] as string[]
    files?.forEach((file) => {
      if (
        !file.includes('valueset') &&
        !file.includes('codesystem') &&
        !file.includes('structuredefinition')
      ) {
        const buf = fs.readFileSync(`${examplesDir}/${file}`)
        const content = buf.toString()
        const resource = JSON.parse(content)
        const { resourceType } = resource
        delete resource.text
        const resourceWoComments = removeKeys(resource, [ 'fhir_comments' ])
        testFile.push(`dut = ${JSON.stringify(resourceWoComments)} as fhir.${resourceType};`)
      }
    })

    console.log(`* Writing to ${outputDir}/fhir-test.ts...`)
    fs.writeFile(`${outputDir}/fhir-tests.ts`, testFile.join("\n"), (err) => {
      if (err) throw err
      cb()
    })
  })
}


export const createR2Examples = (cb: Function) => {
  const examplesDir = `${__dirname}/examples`
  const testDir = `${__dirname}/build/r2`
  download('https://hl7.org/fhir/DSTU2/examples-json.zip', `${examplesDir}/examples-r2.zip`, () => {
    buildExamples(`${examplesDir}/examples-r2`, testDir, cb)
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
export default gulp.series(createR2Examples)
