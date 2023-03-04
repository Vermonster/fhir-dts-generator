// These are examples to skip in the tests, because the are invalid in the spec
export default {
  r2: [
    'patient-example.canonical.json', // random NULL
    'patient-example.json', // random NULL
    'relatedperson-example.canonical.json', // random NULL
    'relatedperson-example.json', // random NULL
  ],
  r3: [],
  r4b: [
    'examplescenario-questionnaire.canonical.json', // missing linkId
    'examplescenario-questionnaire.json', // missing linkId
    'activitydefinition-example.json', // null event
    'activitydefinition-predecessor-example.json', // null event
    'activitydefinition-servicerequest-example.json', // null event
    'plandefinition-example-cardiology-os.json', // null event
    'plandefinition-example.json', // null event
    'administrableproductdefinition-example.json', // should not be a status
    'adverseevent-example.json', // shoud not be a status

  ],
  r4: [
    'examplescenario-questionnaire.canonical.json', // missing linkId
    'examplescenario-questionnaire.json', // missing linkId
    'activitydefinition-example.json', // null event
    'activitydefinition-predecessor-example.json', // null event
    'activitydefinition-servicerequest-example.json', // null event
    'plandefinition-example-cardiology-os.json', // null event
    'plandefinition-example.json', // null event
  ],
  r5: [
    'questionnaireresponse-example-f201-lifelines.json' // missing questionnaire, was required in R5-snapshot-3
  ]
}
