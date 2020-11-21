module.exports = function(grunt) {

  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks('grunt-if-missing');

  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    'request-progress': {
      'download-specification': {
        options: {
          allowOverwrite: false,
          src: 'http://www.hl7.org/fhir/fhir-spec.zip',
          dst: 'specification/fhir-spec.zip'
        }
      }
    },

    unzip: {
      'specification/fhir-spec/': 'specification/fhir-spec.zip'
    },

    clean: {
      build: {
        src: [
          "build/src"
        ]
      }
    },

    ts: {
      default : {
        tsconfig: './tsconfig.json'
      }
    },

    copy: {
      build: {
        files: [
          /* General */
          {
            expand: true,
            src: [
              'package.json'
            ],
            dest: 'build/src/'
          }
        ]
      }
    },

    execute: {
      generate: {
        src: [ 'build/src/main.js' ]
      }
    }


  });


  // Default task(s).
  grunt.registerTask("default", [ "setup", "build", "generate" ]);
  grunt.registerTask("setup", [ "request-progress:download-specification", "if-missing:unzip" ]);
  grunt.registerTask("build", [ "clean:build", "ts", "copy:build" ]);
  grunt.registerTask("generate", [ "execute:generate" ]);
};
