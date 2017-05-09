---
title: WordPress Component Design with Timber & Twig
date: 2017-05-08 20:21:00 -04:00
description: "(under construction)"
---

At Goshen College, we use the [Timber framework](https://www.upstatement.com/timber/) for Wordpress themes. Timber relies on [Twig](https://twig.sensiolabs.org/) for templating, which is {{similar.in|syntax}} to other templating engines like Handlebars (JavaScript) or Jinja (Python).

In my experience, **learning Twig isn't the hard part.** The Timber docs do a good job of explaining how to pass a PHP array to a Timber template and use the many nifty Wordpress shortcuts that Timber provides. 

But good template design is hard. I don't claim to be an expert by any means, but just want to share some templates I've iterated on many times and today make developing performant Wordpress sites significantly easier.

## Basic Component Structure
You'll want to put your CSS first, your HTML second, and your JavaScript last. This way your HTML doesn't show up before it's styled and you don't need to wait for the DOMContentLoaded event (that's $(document).ready() in jQuery land) for your JavaScript to be able to reference your HTML.

I generally use a random id for each component too, just to make them easier to reference in JS.

{% raw %}
```Twig
<link href="component.css" rel="stylesheet" />

{% set id = 'component--' ~ random() %}
<figure id="{{id}}" class="component">
  {{ component.content }}
</figure>

<script>
document.querySelector('#{{id}}').doSomething();
</script>
```
{% endraw %}