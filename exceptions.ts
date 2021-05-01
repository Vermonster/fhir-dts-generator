// These are examples to skip in the tests, because the are invalid in the spec
export default {
  'r2': [
    'patient-example.canonical.json', // random NULL
    'patient-example.json', // random NULL
    'relatedperson-example.canonical.json', // random NULL
    'relatedperson-example.json' // random NULL
  ],
  'r3': [ ],
  'r4': [
    'examplescenario-questionnaire.canonical.json', // missing linkId
    'examplescenario-questionnaire.json' // missing linkId
  ]
}
