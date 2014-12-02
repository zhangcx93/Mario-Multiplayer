/*global module:false*/
module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' + ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      build: {
        options: {
          banner: '<%= banner %>'
        },
        src: ['src/element.js', 'src/globals.js', 'src/util.js', 'src/ui.js', 'src/map.js', 'src/player.js', 'src/keyBinding.js', 'src/network.js', 'src/main.js', 'src/angular.js'],
        dest: 'lib.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.build.dest %>',
        dest: 'static/js/geetest.<%= pkg.version %>.js'
      }
    },
    watch: {
      js: {
        files: ['src/*.js'],
        tasks: ["concat"],
        options: {
          livereload: true
        }
      }

    }

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['concat']);

};