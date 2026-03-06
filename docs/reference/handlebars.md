# Handlebars in Templates

The `.mmdx` template body supports standard [Handlebars](https://handlebarsjs.com/) syntax. Templates are compiled with `noEscape: true`, so special characters in parameter values pass through to Mermaid as-is.

## Variable Interpolation

Insert parameter values with double curly braces:

```handlebars
Appliance[{{applianceName}}]
```

This inserts the current value of `applianceName` directly into the Mermaid output.

## Conditional Blocks

Include or exclude diagram sections based on boolean parameters:

```handlebars
{{#if enableFeature}}
A --> B[Feature]
{{/if}}
```

Use <code v-pre>{{else}}</code> for alternate content:

```handlebars
{{#if enableStaging}}
Registry --> Staging
{{else}}
Registry --> Production
{{/if}}
```

## Nested Conditionals

Conditionals can be nested to any depth:

```handlebars
{{#if enableCache}}
  {{#if appNode1}}
  App1 --> Cache[(Redis)]
  {{/if}}
{{/if}}
```

## Important Notes

- **Truthiness only** -- <code v-pre>{{#if}}</code> checks whether a value is truthy. It does not support comparisons like <code v-pre>{{#if port > 1000}}</code>. For complex logic, register a [custom Handlebars helper](/architecture/extending#custom-handlebars-helpers).
- **Blank line collapsing** -- Disabled <code v-pre>{{#if}}</code> blocks leave blank lines in the output. The engine automatically collapses consecutive blank lines so Mermaid does not choke on unexpected whitespace.
- **No escaping** -- Handlebars is configured with `noEscape: true`, so special characters (`<`, `>`, `&`, etc.) pass through as-is. This is necessary for Mermaid syntax like `A --> B`.

## Other Built-in Helpers

While <code v-pre>{{#if}}</code> and <code v-pre>{{else}}</code> are the most commonly used, Handlebars provides additional built-in helpers:

- <code v-pre>**{{#unless}}**</code> -- Inverse of <code v-pre>{{#if}}</code>, renders when the value is falsy
- <code v-pre>**{{#each}}**</code> -- Iterates over arrays (not currently used in parameter types, but available)
- <code v-pre>**{{#with}}**</code> -- Changes the context scope
- <code v-pre>**{{lookup}}**</code> -- Dynamic property lookup

## Resources

- [Handlebars Guide](https://handlebarsjs.com/guide/) -- Official getting started guide
- [Expressions](https://handlebarsjs.com/guide/expressions.html) -- Variable interpolation and subexpressions
- [Built-in Helpers](https://handlebarsjs.com/guide/builtin-helpers.html) -- `if`, `unless`, `each`, `with`, `lookup`
- [Block Helpers](https://handlebarsjs.com/guide/block-helpers.html) -- Writing custom block helpers for advanced logic
