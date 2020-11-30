---
title: WordPress Component Design with Timber & Twig
date: 2017-05-08 20:21:00 -04:00
description: Component initialization & critical CSS strategies
tags: post
---

At Goshen College, we use the [Timber framework](https://www.upstatement.com/timber/) for Wordpress themes. Timber relies on [Twig](https://twig.sensiolabs.org/) for templating, which is {% raw %}{{&nbsp;similar.in&nbsp;\|&nbsp;syntax&nbsp;}}{% endraw %} to other templating engines like Handlebars (JavaScript) or Jinja (Python).

In my experience, **learning Twig isn't the hard part.** The Timber docs do a good job of explaining how to pass a PHP array to a Timber template and use the many nifty Wordpress shortcuts that Timber provides.

But good template design is hard. I don't claim to be an expert by any means, but just want to share some templates I've iterated on many times and today make developing performant Wordpress sites significantly easier.

## Basic Component Structure

You'll want to put your CSS first, your HTML second, and your JavaScript last. This way your HTML doesn't show up before it's styled and you don't need to wait for the DOMContentLoaded event (that's \$(document).ready() in jQuery land) for your JavaScript to be able to reference your HTML.

I generally use a random id for each component too, just to make them easier to reference in JS.

```php
function my_shortcode($atts)
{
	// shortcode logic...

	return Timber::compile('my-component.twig', [
		'content' => '...'
		'pathToCSS' => '...'
		'pathToJS' => '...'
	]);
}
```

{% raw %}

```twig
<link href="{{ pathToCSS }}" rel="stylesheet" />

{% set id = 'my-component--' ~ random() %}
<figure id="{{ id }}" class="my-component">
  {{ content }}
</figure>

<!-- Pardon my (awful) blocking synchronous JS. That's not what this article is about! -->
<script src="{{ pathToJS }}"></script>
<script>
	initializeComponent( document.querySelector('#{{ id }}') );
</script>
```

{% endraw %}

Most components should be written in such a way that they can coexist on the same page. In the above example, I really just need to load the CSS and JS file once, not every time the component shows up on the page!

One way of keeping track of this is through a custom Twig filter. Let's call it _first_on_page_, have it accept one argument (the name of the component), and return True the first time it's called and False every time after that.

```php
$twig->addFilter(new Twig_SimpleFilter('first_on_page', function ( $componentName )
{
	global $componentsAlreadyInitialized;

	if ( !isset($componentsAlreadyInitialized) ) $componentsAlreadyInitialized = ',';

	// Components is not already on this page. Add it to global var.
	if ( strpos($componentsAlreadyInitialized, ','. $componentName .',') === false ) {
		$componentsAlreadyInitialized .= $componentName . ',';
		return true;
	}

	return false;
}));
```

There are probably _classier_ ways of doing this (how about that pun!), but a global variable gets the job done here.

{% raw %}

```twig
{% if 'myComponent'|first_on_page %}
	<link href="{{ pathToCSS }}" rel="stylesheet" />
{% endif %}

{% set id = 'my-component--' ~ random() %}
<figure id="{{ id }}" class="my-component">
  {{ content }}
</figure>

{% if 'myComponent'|first_on_page %}
	<script src="{{ pathToJS }}"></script>
{% endif %}

<script>
	initializeComponent( document.querySelector('#{{ id }}') );
</script>
```

{% endraw %}

## Critical CSS and Asynchronous Stylesheets

Critical CSS (inlining a minimal set of above-the-fold styles) can dramatically improve perceived performance, especially on high latency connections.

<em>I've also heard jogging a half hour every day will dramatically improve my perceived healthiness, but that doesn't mean I'm doing it.</em>

I get it: transitioning from a huge _style.css_ file in your <code><head></code> to a bunch of smaller CSS files, each split into critical and non-critical sections can be tricky! There are tools that will automatically generate critical CSS for you (e.g. [Penthouse](https://github.com/pocketjoso/penthouse), [critical](https://github.com/addyosmani/critical)), but I found that generating HTML files for these tools to operate on was error-prone. Ultimately, I went with a DIY solution that split up my CSS based on comments: [postcss-critical-split](https://github.com/mrnocreativity/postcss-critical-split) by [Ronny Welter](https://github.com/mrnocreativity). The silver lining: I got _very_ well acquainted with the styles on my site and was able to remove a lot of unused rules.

At the end of the day we have 3 files. Let's call them:

- original
- critical
- asynchronous

Where original = critical + asynchronous

Then we can inline the critical CSS in the <code><head></code> and use a JavaScript library called [loadCSS by Filament Group](https://github.com/filamentgroup/loadCSS) to load asynchronous CSS. Chances are we'll screw something up in the process so it's handy to have the original CSS available to compare against.

Ideally, we could abstract this all away so that injecting CSS is as easy as including a Twig template:

_Critical + asynchronous CSS in <code><head></code>_
{% raw %}

```twig
{% for styleSheetName in criticalStyleSheets %}
	{% include 'stylesheet.twig' with { 'name': styleSheetName, 'type:': 'critical+async' } %}
{% endfor %}

<script>
	// Inline the LoadCSS library here
</script>
```

{% endraw %}

Where you'd define _criticalStyleSheets_ in your templates as an array of stylesheet names, e.g.

```php
// _init_timber.php
$context['criticalStyleSheets'] = ['main', 'header'];

// archive.php (or any other template)
$context['criticalStyleSheets'][] = 'archive';
```

_Synchronous CSS at the beginning of my-component template_
{% raw %}

```twig
{% if 'myComponent'|first_on_page %}
	{% include 'stylesheet.twig' with { 'name': 'my-component', 'type:': 'sync' } %}
{% endif %}
```

{% endraw %}

_stylesheet.twig_

{% raw %}

```twig
{% set path = '/wp-content/themes/my-theme/styles/dist/' %}

{% if type == 'sync' %}

	<link rel="stylesheet" href="{{path ~ name ~ '-original.css'}}">

{% elseif type == 'critical+async' %}

	<style>{{name|critical_css_inline}}</style>

	<link rel="preload" href="{{path ~ name ~ '-async.css'}}" as="style" onload="this.rel='stylesheet'">
	<noscript><link rel="stylesheet" href="{{path ~ name ~ '-async.css'}}"></noscript>

{% else %}
	<!-- Invalid stylesheet type specified: type="{{type}}", name="{{name}}" -->

{% endif %}
```

{% endraw %}

You'll notice a _critical_css_inline_ filter which simply returns _file_get_contents()_ on a CSS file, but otherwise it's pretty simple.

I've also found it nifty to omit all non-critical styles when building critical stylesheets to ensure the first paint looks like it should. One easy way to do this on the fly is with the GET parameter, e.g.

```php
// _init_timber.php
$context['onlyCriticalCSS'] = isset($_GET['only-critical-css']);
```

Then in _stylesheet.twig_
{% raw %}

```twig
<!-- ... -->
{% elseif type == 'critical+async' %}

	<style>{{name|critical_css_inline}}</style>

	{% if not onlyCriticalCSS %}
		<link rel="preload" href="{{path ~ name ~ '-async.css'}}" as="style" onload="this.rel='stylesheet'">
		<noscript><link rel="stylesheet" href="{{path ~ name ~ '-async.css'}}"></noscript>
	{% endif %}
<!-- ... -->
```

{% endraw %}

Using [LiveReload](http://livereload.com/) when tweaking critical + asynchronous stylesheets poses a similar issue: the inline CSS never gets updated. Fixing this is as simple as adding an _omit-sync-css_ GET parameter, which can be used to disable inlining (and make everything synchronous) during development.
