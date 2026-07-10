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

## Custom Helpers {#custom-helpers}

Six custom helpers are registered in `src/templateEngine.ts` and available in every template. Use them as subexpressions (wrapped in parentheses) inside <code v-pre>{{#if}}</code>:

- <code v-pre>{{#if (eq a b)}}</code> -- Strict equality (`a === b`)
- <code v-pre>{{#if (gt a b)}}</code> -- Numeric greater-than (`Number(a) > Number(b)`)
- <code v-pre>{{#if (not a)}}</code> -- Logical negation (`!a`)
- <code v-pre>{{#if (and a b)}}</code> -- Logical AND of two values (`a && b`)
- <code v-pre>{{#if (or a b)}}</code> -- Logical OR of two values (`a || b`)
- <code v-pre>{{countTrue a b c}}</code> -- Returns how many of the given values are truthy (accepts any number of arguments)

Working examples from the shipped templates:

```handlebars
{{! eq: compare a select parameter against an option value }}
{{#if (eq deploymentType "saas")}}
CONSOLE[UEM Console - SaaS]
{{/if}}

{{! and: require two booleans at once }}
{{#if (and modeExternal showFirewalls)}}
FW1[Front-end Firewall]
{{/if}}

{{! or: either boolean enables the section }}
{{#if (or radiusAuth rsaSecurID)}}
CS -->|5500 UDP<br/>Two-factor auth| AUTH
{{/if}}

{{! not: combine with and for "A but not B" }}
{{#if (and enableUserAuth (not enableDirSync))}}
2 vCPU, 4 GB RAM, 40 GB Disk
{{/if}}

{{! countTrue + gt: render only when more than one service is enabled }}
{{#if (gt (countTrue enableDirSync enableUserAuth enableKerberosAuth enableVirtualApp) 1)}}
Multi-service sizing applies
{{/if}}
```

Helpers can be nested, as in the last example: `countTrue` tallies how many of the four toggles are on, and `gt` compares the count against a threshold.

## Important Notes

- **Truthiness only** -- <code v-pre>{{#if}}</code> checks whether a value is truthy. It does not support inline comparisons like <code v-pre>{{#if port > 1000}}</code> -- use the built-in [custom helpers](#custom-helpers) as subexpressions instead, e.g. <code v-pre>{{#if (gt port 1000)}}</code>. To add more helpers, see [Extending the App](/architecture/extending#custom-handlebars-helpers).
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
