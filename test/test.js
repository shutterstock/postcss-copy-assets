var mockFs  = require('mock-fs');
var postcss = require('postcss');
var expect  = require('chai').expect;
var path  = require('path');
var fs = require('fs');

var plugin = require('../');

/* eslint-disable key-spacing */
var fsFixture = {
    test: {
        fixtures: {
            'test5.png': '5',
            src: {
                'test2.png': '2',
                images: {
                    'test3.png': '3',
                    logos: {
                        'test4.png': '4',
                        'test6.png': '6'
                    }
                },
                css: {
                    'test1.png': '1',
                    fonts: {
                        'testfont1.woff': 'woff',
                        'testfont1.ttf': 'ttf'
                    }
                }
            },
            images: {
                'test6.png': '6'
            }
        }
    }
};
/* eslint-enable key-spacing */


/**
 * Tests plugin with given options
 *
 * @param {string} input - Input css
 * @param {string} output - Expected output css
 * @param {string[]} outputFiles - Expected output files to be copied
 * @param {object} opts - Options to pass along
 * @param {object} opts.postcss - Options for PostCSS
 * @param {object} opts.plugin - Options for plugin itself
 * @param {number} warningsCount - Expected number of PostCSS warnings
 * @param {function} done - Async callback
 * @returns {void}
 */
var test = function (input, output, outputFiles, opts, warningsCount, done) {
    postcss([ plugin(opts.plugin) ]).process(input, opts.postcss)
        .then(function (result) {
            var warnings = result.warnings();
            expect(result.css).to.eql(output);
            if (warnings.length && warnings.length !== warningsCount) {
                console.log(warnings.join('\n'));
            }
            expect(warnings.length, warningsCount + ' warning(s) expected')
                .to.be.equal(warningsCount);
            if (outputFiles) {
                outputFiles.forEach(function (filepath) {
                    var outputExists = fs.existsSync(path.resolve(filepath));
                    if (!outputExists) {
                        console.log(fs.readdirSync(path.dirname(filepath)));
                    }
                    expect(outputExists, filepath + ' exists').to.be.true;
                });
            }
            done();
        }).catch(function (error) {
            done(error);
        });
};

describe('postcss-copy-assets', function () {

    var opts;

    beforeEach(function () {
        mockFs(fsFixture);
        opts = {
            postcss: {
                from: 'test/fixtures/src/css/test.css',
                to:   'test/dist/assets/css/test.css'
            },
            plugin: {
                base: 'test/dist/assets'
            }
        };
    });

    afterEach(function () {
        mockFs.restore();
    });

    it('warns if no "from" option provided', function (done) {
        delete opts.postcss.from;
        test('a{ background: url("foo") }',
             'a{ background: url("foo") }',
             null,
             opts, 1, done);
    });

    it('warns if no "to" option provided', function (done) {
        delete opts.postcss.to;
        test('a{ background: url("foo") }',
             'a{ background: url("foo") }',
             null,
             opts, 1, done);
    });

    it('warns if no "base" option provided', function (done) {
        delete opts.plugin;
        test('a{ background: url("foo") }',
             'a{ background: url("foo") }',
             null,
             opts, 1, done);
    });

    it('warns if asset file not there', function (done) {
        test('a{ background: url("test-not-there.png") }',
             'a{ background: url("../test-not-there.png") }',
             null,
             opts, 1, done);
    });

    it('ignores root-relative url()', function (done) {
        test('a{ background: url("/test/fixtures/src/images/test3.png") }',
             'a{ background: url("/test/fixtures/src/images/test3.png") }',
             null,
             opts, 0, done);
    });

    it('ignores http absolute url()', function (done) {
        test('a{ background: url("http://example.com/images/test3.png") }',
             'a{ background: url("http://example.com/images/test3.png") }',
             null,
             opts, 0, done);
    });

    it('ignores https absolute url()', function (done) {
        test('a{ background: url("https://example.com/images/test3.png") }',
             'a{ background: url("https://example.com/images/test3.png") }',
             null,
             opts, 0, done);
    });

    it('ignores file absolute url()', function (done) {
        test('a{ background: url("file:///src/images/test3.png") }',
             'a{ background: url("file:///src/images/test3.png") }',
             null,
             opts, 0, done);
    });

    it('ignores protocol-relative absolute url()', function (done) {
        test('a{ background: url("//example.com/images/test3.png") }',
             'a{ background: url("//example.com/images/test3.png") }',
             null,
             opts, 0, done);
    });

    it('ignores data URI url()', function (done) {
        test('a{ background: url("data:foo;abcd") }',
             'a{ background: url("data:foo;abcd") }',
             null,
             opts, 0, done);
    });

    it('handles asset in same dir as css', function (done) {
        test('a{ background: url("test1.png") }',
             'a{ background: url("../test1.png") }',
             ['test/dist/assets/test1.png'],
             opts, 0, done);
    });

    it('handles asset in parent dir from css', function (done) {
        test('a{ background: url("../test2.png") }',
             'a{ background: url("../test2.png") }',
             ['test/dist/assets/test2.png'],
             opts, 0, done);
    });

    it('handles asset in child dir from css', function (done) {
        test('a{ background: url("fonts/testfont1.woff") }',
             'a{ background: url("../fonts/testfont1.woff") }',
             ['test/dist/assets/fonts/testfont1.woff'],
             opts, 0, done);
    });

    it('handles asset in different tree from css', function (done) {
        test('a{ background: url("../images/test3.png") }',
             'a{ background: url("../images/test3.png") }',
             ['test/dist/assets/images/test3.png'],
             opts, 0, done);
    });

    it('handles asset in different tree from css with subdirs',
        function (done) {
            test('a{ background: url("../images/logos/test4.png") }',
                 'a{ background: url("../images/logos/test4.png") }',
                 ['test/dist/assets/images/logos/test4.png'],
                 opts, 0, done);
        }
    );

    it('handles asset outside base dir from css', function (done) {
        test('a{ background: url("../../test5.png") }',
             'a{ background: url("../test5.png") }',
             ['test/dist/assets/test5.png'],
             opts, 0, done);
    });

    it('handles asset outside base dir from css with subdirs',
        function (done) {
            test('a{ background: url("../../images/test6.png") }',
                 'a{ background: url("../images/test6.png") }',
                 ['test/dist/assets/images/test6.png'],
                 opts, 0, done);
        }
    );

    it('handles asset base dir different tree from css "to" dir',
        function (done) {
            opts = {
                postcss: {
                    from: 'test/fixtures/src/css/test.css',
                    to:   'test/dist/assets/css/test.css'
                },
                plugin: {
                    base: 'test/dist/other'
                }
            };
            test('a{ background: url("../images/logos/test4.png") }',
                 'a{ background: url("../../other/images/logos/test4.png") }',
                 ['test/dist/other/images/logos/test4.png'],
                 opts, 0, done);
        }
    );

    it('handles css "to" path shorter than "from" path', function (done) {
        opts.postcss = {
            from: 'test/fixtures/src/css/page/group/test.css',
            to:   'test/dist/assets/css/test.css'
        };
        test('a{ background: url("../../../images/logos/test4.png") }',
             'a{ background: url("../images/logos/test4.png") }',
             ['test/dist/assets/images/logos/test4.png'],
             opts, 0, done);
    });

    it('handles css "to" path longer than "from" path', function (done) {
        opts.postcss = {
            from: 'test/fixtures/src/css/test.css',
            to:   'test/dist/assets/css/page/group/test.css'
        };
        test('a{ background: url("../images/logos/test4.png") }',
             'a{ background: url("../../../images/logos/test4.png") }',
             ['test/dist/assets/images/logos/test4.png'],
             opts, 0, done);
    });

    it('handles query string in url()', function (done) {
        test('a{ background: url("../images/test3.png?foo=abc") }',
             'a{ background: url("../images/test3.png?foo=abc") }',
             ['test/dist/assets/images/test3.png'],
             opts, 0, done);
    });

    it('handles hash in url()', function (done) {
        test('a{ background: url("../images/test3.png#bar") }',
             'a{ background: url("../images/test3.png#bar") }',
             ['test/dist/assets/images/test3.png'],
             opts, 0, done);
    });

    it('handles query string and hash in url()', function (done) {
        test('a{ background: url("../images/test3.png?foo=abc#bar") }',
             'a{ background: url("../images/test3.png?foo=abc#bar") }',
             ['test/dist/assets/images/test3.png'],
             opts, 0, done);
    });

    it('handles no quotes in url()', function (done) {
        test('a{ background: url(../images/test3.png) }',
             'a{ background: url("../images/test3.png") }',
             ['test/dist/assets/images/test3.png'],
             opts, 0, done);
    });

    it('handles whitespace in url()', function (done) {
        test('a{ background: url(  "../images/test3.png  "    ) }',
             'a{ background: url("../images/test3.png") }',
             ['test/dist/assets/images/test3.png'],
             opts, 0, done);
    });

    it('handles single quotes in url()', function (done) {
        test('a{ background: url( \'  ../images/test3.png\' ) }',
             'a{ background: url("../images/test3.png") }',
             ['test/dist/assets/images/test3.png'],
             opts, 0, done);
    });

    it('handles url() alongside other parts of declaration', function (done) {
        test('a{ background: rgba(1,1,1,1) url("test1.png") #fab no-repeat}',
             'a{ background: rgba(1,1,1,1) url("../test1.png") #fab no-repeat}',
             ['test/dist/assets/test1.png'],
             opts, 0, done);
    });

    it('handles multiple url()s in same declaration', function (done) {
        test('a{ background: url("test1.png") url( \'../test2.png \'  ) ' +
             'url(../images/test3.png) }',
             'a{ background: url("../test1.png") url("../test2.png") ' +
             'url("../images/test3.png") }',
             ['test/dist/assets/test1.png', 'test/dist/assets/test2.png',
             'test/dist/assets/images/test3.png'],
             opts, 0, done);
    });

    it('handles font-face src declaration', function (done) {
        test('src: url("fonts/testfont1.woff") format("woff"), ' +
             'url("fonts/testfont1.ttf") format("truetype");',
             'src: url("../fonts/testfont1.woff") format("woff"), ' +
             'url("../fonts/testfont1.ttf") format("truetype");',
             ['test/dist/assets/fonts/testfont1.woff',
             'test/dist/assets/fonts/testfont1.ttf'],
             opts, 0, done);
    });

});
