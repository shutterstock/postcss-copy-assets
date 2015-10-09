var postcss = require('postcss');
var path = require('path');
var url = require('url');
var fs = require('fs');
var mkdirp = require('mkdirp');

/**
 * Trims whitespace and quotes from css 'url()' values
 *
 * @param {string} value - string to trim
 * @returns {string} - the trimmed string
 */
function trimUrlValue(value) {
    var beginSlice, endSlice;
    value = value.trim();
    beginSlice = value.charAt(0) === '\'' || value.charAt(0) === '"' ? 1 : 0;
    endSlice = value.charAt(value.length - 1) === '\'' ||
        value.charAt(value.length - 1) === '"' ?
        -1 : undefined;
    return value.slice(beginSlice, endSlice).trim();
}

/**
 * Finds the base dir common to two paths.
 * For example '/a/b/c/d' and '/a/b/c/x/y' have '/a/b/c' in common.
 *
 * @param {string} a - path a
 * @param {string} b - path b
 * @returns {string} - the base dir common to both paths
 */
function getCommonBaseDir(a, b) {
    var common = [];
    a = a.split(path.sep);
    b = b.split(path.sep);
    for (var i = 0; i < a.length; i++) {
        if (b[i] === undefined || b[i] !== a[i]) {
            break;
        }
        common.push(a[i]);
    }
    return common.join(path.sep);
}

/**
 * Processes a Declaration containing 'url()'
 *
 * @param {object} decl - PostCSS Declaration
 * @param {string} assetBase - Base path to copy assets to
 * @param {object} opts - options passed to PostCSS
 * @param {object} postCssResult - PostCSS Result
 * @returns {void}
 */
function handleUrlDecl(decl, assetBase, opts, postCssResult) {
    // Replace 'url()' parts of Declaration
    decl.value = decl.value.replace(/url\((.*?)\)/g,
        function (fullMatch, urlMatch) {
            // Example:
            //   decl.value = 'background: url("../../images/foo.png?a=123");'
            //   urlMatch   = '"../../images/foo.png?a=123"'
            //   assetBase  = 'dist/assets'
            //   opts.from  = 'src/css/page/home.css'
            //   opts.to    = 'dist/assets/css/home.min.css'

            // "../../images/foo.png?a=123" -> ../../images/foo.png?a=123
            urlMatch = trimUrlValue(urlMatch);

            // Ignore absolute urls, data URIs, or hashes
            if (urlMatch.indexOf('/') === 0 ||
                urlMatch.indexOf('data:') === 0 ||
                urlMatch.indexOf('#') === 0 ||
                /^[a-z]+:\/\//.test(urlMatch)) {
                return fullMatch;
            }

            // '/path/to/project/src/css/page/'
            var cssFromDirAbs = path.dirname(path.resolve(opts.from));
            // '/path/to/project/dist/assets/css/page/'
            var cssToDir = path.dirname(opts.to);
            // parsed.pathname = '../../images/foo.png'
            var assetUrlParsed = url.parse(urlMatch);
            // '/path/to/project/src/images/foo.png'
            var assetFromAbs =
                path.resolve(cssFromDirAbs, assetUrlParsed.pathname);
            // 'foo.png'
            var assetBasename = path.basename(assetUrlParsed.pathname);
            // '/path/to/project/src/images'
            var assetFromDirAbs = path.dirname(assetFromAbs);
            // '/path/to/project/src'
            var fromBaseDirAbs =
                getCommonBaseDir(assetFromDirAbs, cssFromDirAbs);
            // 'images'
            var assetPathPart = path.relative(fromBaseDirAbs, assetFromDirAbs);
            // '/path/to/project/dist/assets/images'
            var newAssetPath = path.join(assetBase, assetPathPart);
            // 'foo.png?a=123'
            var urlBasename = assetBasename +
                (assetUrlParsed.search ? assetUrlParsed.search : '') +
                (assetUrlParsed.hash ? assetUrlParsed.hash : '');
            // '../../images/foo.png?a=123'
            var newUrl = 'url("' +
                path.join(path.relative(cssToDir, newAssetPath), urlBasename) +
                '")';

            // Read the original file
            var contents;
            try {
                contents = fs.readFileSync(assetFromAbs);
            } catch(e) {
                postCssResult.warn('Can\'t read asset file "' +
                    assetFromAbs + '". Ignoring.', { node: decl });
                return newUrl;
            }

            // Create any new directories
            try {
                mkdirp.sync(newAssetPath);
            } catch(e) {
                postCssResult.warn('Can\'t create new asset dir "' +
                    newAssetPath + '". Ignoring.', { node: decl });
                return newUrl;
            }

            // '/path/to/project/dist/assets/images/foo.png'
            var newAssetFile = path.join(newAssetPath, assetBasename);
            try {
                // Write new asset file to assetBase
                fs.writeFileSync(newAssetFile, contents);
            } catch(e) {
                postCssResult.warn('Can\'t write new asset file "' +
                    newAssetFile + '". Ignoring.', { node: decl });
                return newUrl;
            }

            // Return the new url() string
            return newUrl;
        }
    );
}

module.exports = postcss.plugin('postcss-copy-assets', function (copyOpts) {
    copyOpts = copyOpts || {};
    return function (css, result) {
        var postCssOpts = result.opts;
        if (!postCssOpts.from) {
            result.warn('postcss-copy-assets requires postcss "from" option.');
            return;
        }
        if (!postCssOpts.to || postCssOpts.to === postCssOpts.from) {
            result.warn('postcss-copy-assets requires postcss "to" option.');
            return;
        }
        if (!copyOpts.base) {
            var str = postCssOpts.to;
            copyOpts.base = str.substring(0, str.lastIndexOf('/'));
        }
        var assetBase = path.resolve(copyOpts.base);
        css.walkDecls(function (decl) {
            if (decl.value && decl.value.indexOf('url(') > -1) {
                handleUrlDecl(decl, assetBase, postCssOpts, result);
            }
        });
    };
});
