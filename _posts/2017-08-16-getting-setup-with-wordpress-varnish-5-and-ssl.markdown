---
title: Getting setup with WordPress, Varnish&nbsp;5 and SSL
date: 2017-08-16 21:26:00 -07:00
description: (under construction)
---

*(This post is actively being written and edited. I've decided to release it early b/c there are so few guides on Varnish 5 and it's integration with WordPress. Copy code snippets at your own risk!)*

A few months ago we reduced [goshen.edu](https://www.goshen.edu)'s Time To First Byte (TTFB) from 400ms to 150ms! 

[Varnish Cache](https://varnish-cache.org/intro/index.html#intro) is a HTTP reverse proxy optimized for caching your most requested resources and serving them up extremely fast. Practically, it means your site will be *faster for most users most of the time* and if you ever get lucky enough to experience a huge spike in traffic, your server won't go down.

*It goes without saying that there are lots of good WordPress caching plugins. We opted for Varnish b/c it's not a WordPress-only solution and has incredible flexibility. Were we to do it over again, we'd definitely consider NGINX's built-in cache, as it's simpler to implement.*

## The stack

### Before 

Easy peasy, a single Apache server in charge of everything:

| Server | Details |
| ------ | ------- |
| Apache | Hosts WordPress, handles SSL and HTTP/2 |

### After

Now, NGINX checks in with Varnish, responding immediately with a cached copy or falling back to Apache.

| Server | Details |
| ------ | ------- |
| NGINX | Hosts Varnish, handles SSL and HTTP/2 |
| Apache | Hosts WordPress |

Probably the trickiest part of the new setup is due to Varnish's lack of support for SSL. Hence, NGINX must strip SSL before it sends requests to Varnish and then add SSL back to requests that Varnish passes to Apache. It's complicated.

## Varnish VCL

Our [VCL is on Github](https://github.com/pranksinatra/gc-varnish-config), and is based on Mattias Geniar's [Varnish 5.0 Configuration Templates](https://github.com/mattiasgeniar/varnish-5.0-configuration-templates).

### Purging & Banning

I'd recommend [reading the docs](https://varnish-cache.org/docs/5.0/users-guide/purging.html) on this one, but the gist of cache invalidation in Varnish is that you *purge individual urls* (e.g. when a page is updated) and *ban groups of urls* with a regular expression (e.g. when a site's WordPress theme is changed).

Our VCL restricts BAN and PURGE HTTP requests to the Apache server's IP address (localhost or 127.0.0.1), so only WordPress can send these requests. 

```
# ACL for whitelisting PURGE and BAN requests
acl purge {
	"localhost";
	"127.0.0.1";
}
```

You'll also notice that we BAN urls that are requested with a `Cache-Control: no-cache` header:

```
# Respect the browser's desire for a fresh copy on hard refresh
if (req.http.Cache-Control == "no-cache") {
	ban("req.http.host == " + req.http.host + " && req.url == " + req.url);
}
```

These headers are set by browsers during a *hard refresh* (Ctrl/Cmd + Shift + R), and we use them to allow users to get a fresh copy of a page if they really want one. Of course, this also opens us up to DDOS attacks, but that hasn't been an issue to date.

### Large Files

Varnish fully supports streaming, but large files can quickly fill up its cache. Since our performance bottleneck is WordPress-generated pages, not static files, we have Varnish ignore audio, video and zipped files entirely:

```
# Don't cache any large files (zip, audio, video, etc.)
# Varnish does support streaming, but nginx will do it just as well
if (req.url ~ "^[^?]*\.(7z|avi|bz2|flac|flv|gz|mka|mkv|mov|mp3|mp4|mpeg|mpg|ogg|ogm|opus|rar|tar|tgz|tbz|txz|wav|webm|wmv|xz|zip)(\?.*)?$") {
	return (pipe);
}
```

...explain pipe vs pass...

### URL Normalization

Varnish caches urls independently, so it's essential to convert them into their "canonical" form before passing them on the Apache. Otherwise, you'll end up with the same page content being cached multiple times and associated with slightly different urls.

*Don't worry, tweaking urls in your VCL won't affect your users' browsers, where the original urls will be used and can be parsed and tracked with JavaScript.*

In our VCL, we normalize urls by:

- Sorting query parameters
- Stripping all marketing-related query parameters that don't affect page content.
- Stripping hashes (e.g. #section-1-a)

## Caching Headers

By default, Varnish will only cache things as long as a browser would cache them given the Expires headers. 

... .htaccess, exceptions, etc..

## WordPress



