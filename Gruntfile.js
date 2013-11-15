module.exports = function (grunt){
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.initConfig({
        compress: {
            main: {
                options: {
                    archive: './dist/app.nw',
                    mode: 'zip'
                },
                files: [
                    {
                        cwd: './src/',
                        expand: true,
                        src: '**'
                    }
                ]
            }
        },

        watch: {
            main: {
                files: ['./src/**'],
                tasks: ['compress']
            }
        }
    });

    grunt.registerTask('default', 'compress');
};