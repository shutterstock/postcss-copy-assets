# PostCSS Copy Assets [![Build Status][ci-img]][ci]

[PostCSS] plugin copies assets referenced by relative url() declarations to a build directory.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/amchardy/postcss-copy-assets.svg
[ci]:      https://travis-ci.org/amchardy/postcss-copy-assets

```css
.foo {
    /* Input example */
}
```

```css
.foo {
  /* Output example */
}
```

## Usage

```js
postcss([ require('postcss-copy-assets')({ base: 'dist'}) ])
```

See [PostCSS] docs for examples for your environment.
