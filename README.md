# PostCSS Copy Assets [![Build Status][ci-img]][ci]

[PostCSS] plugin to copy assets referenced by relative `url()`s into a build directory, while keeping their sub-directory hierarchy.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/shutterstock/postcss-copy-assets.svg
[ci]:      https://travis-ci.org/shutterstock/postcss-copy-assets

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
The base path where the plugin will copy images, fonts, and other assets it finds in CSS `url()` declarations. Only `url()` declarations with relative paths are processed. Each asset's sub-directory hierarchy will be maintained under the base path. Basically, sub-directories after the last `../` in the path will be kept (or the whole path if no `../` exists). For example, the image referred to by `url("../../images/icons/icon.jpg")` will be copied to `<base>/images/icons/icon.jpg`.

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
