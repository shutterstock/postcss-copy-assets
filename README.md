# PostCSS Copy Assets [![Build Status][travis-img]][travis] [![Windows Build Status][appveyor-img]][appveyor]

[PostCSS] plugin to copy assets referenced by relative `url()`s into a build directory, while keeping their sub-directory hierarchy.

[PostCSS]: https://github.com/postcss/postcss
[travis-img]:  https://travis-ci.org/shutterstock/postcss-copy-assets.svg
[travis]:      https://travis-ci.org/shutterstock/postcss-copy-assets
[appveyor-img]:  https://ci.appveyor.com/api/projects/status/vmhvh3cwv0v0wcbg/branch/master?svg=true
[appveyor]:      https://ci.appveyor.com/project/alexmchardy/postcss-copy-assets-dgts6/branch/master

## Installation
```shell
$ npm install postcss-copy-assets
```

## Example
### Usage
```js
var copyAssets = require('postcss-copy-assets');
postcss(
    [
        copyAssets({ base: 'dist'})
    ],
    {
        to: 'dist/css/foo.css'
    }
);
```
### Input
```css
/* src/css/page/home.css */
.icon {
    background: url("../../images/icons/icon.jpg");
}
@font-face {
    src: url("../../fonts/sans.woff") format("woff"), url("../../fonts/sans.ttf") format("truetype");
}
```
```
src/
|-- css/
|   `-- page/
|       `-- home.css
|-- images/
|   `-- icons/
|       `-- icon.jpg
`-- fonts/
    |-- sans.woff
    `-- sans.ttf
```

### Output
```css
/* dist/css/home.min.css */
.icon {
    background: url("../images/icons/icon.jpg");
}
@font-face {
    src: url("../fonts/sans.woff") format("woff"), url("../fonts/sans.ttf") format("truetype");
}
```
```
dist/
|-- css/
|   `-- home.min.css
|-- images/
|   `-- icons/
|       `-- icon.jpg
`-- fonts/
    |-- sans.woff
    `-- sans.ttf
```

## Options

### Plugin options

#### `base`
Type: `string`  
Default: PostCSS `to` option

Optional base path where the plugin will copy images, fonts, and other assets it finds in CSS `url()` declarations. Only `url()` declarations with relative paths are processed. Each asset's sub-directory hierarchy will be maintained under the base path. Basically, sub-directories after the last `../` in the path will be kept (or the whole path if no `../` exists). For example, if the plugin is called with `{ base: 'dist' }`, the image referred to by `url("../../images/icons/icon.jpg")` will be copied to `dist/images/icons/icon.jpg`.

By using a single `base` path, a build pipeline can output several built CSS files (each with its own PostCSS `to` destination) while organizing all their assets under one directory (e.g. under `dist/` in `dist/images/`, `dist/fonts/`, etc.).

If `base` is not specified assets will be copied by default to the base directory given to the PostCSS `to` option while still maintaining the assets' sub-directory hierarchy.  For example, if PostCSS is told to ouput to `dist/css/foo.css` and `base` is not specified the image referred to by `url("../../images/icons/icon.jpg")` will be copied to `dist/css/images/icons/icon.jpg`.  

#### `pathTransform`
Type: `function`  
Default: `undefined`

Optional function that returns a transformed absolute filesystem path to an asset file. Useful for adding revision hashes to filenames for cachebusting (e.g. `image-a7f234e8d4.jpg`), or handling special cases. The function is expected to be of the form given below:
```js
/**
 * Transforms the paths to which asset files will be copied
 *
 * @param {string} newPath - Absolute filesystem path to which asset would be copied by default
 * @param {string} origPath - Absolute filesystem path to original asset file
 * @param {object} contents - Buffer containing asset file contents
 * @returns {string} - Transformed absolute filesystem path to which asset will be copied
 */
pathTransform: function(newPath, origPath, contents) {
    // ... transform newPath ...
    return newPath;
}
```

### PostCSS options

#### `to`
This plugin requires the `to` option to be passed to `postcss` itself. This specifies where the transformed CSS will be written to.

```js
var copyAssets = require('postcss-copy-assets');
postcss(
    [
        copyAssets({ base: 'base/dir/to/copy/assets'})
    ],
    {
        to: 'path/to/transformed/file.css'
    }
);
```

See [PostCSS] docs for examples for your environment.
