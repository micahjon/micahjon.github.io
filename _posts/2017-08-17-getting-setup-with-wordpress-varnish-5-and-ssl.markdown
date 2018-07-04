---
title: Getting setup with WordPress, Varnish&nbsp;5 (or 6) and SSL
date: 2017-08-17 00:26:00 -04:00
description: "Tips from the trenches"
---

<aside>
	<p><em>This post was last updated July 2, 2018.</em></p>
</aside>

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

### URL Normalization

Varnish caches urls independently, so it's essential to convert them into their "canonical" form before passing them on the Apache. Otherwise, you'll end up with the same page content being cached multiple times and associated with slightly different urls.

Tweaking urls in your VCL won't affect your users' browsers, where the original urls will be used and can be parsed and tracked with JavaScript. However, if you strip query parameters and hashes, you can't rely on them for server-side redirects. We got around this by stripping them in *vcl_hash* instead of *vcl_recv* so their still sent to our backend but the canonical URLs are used for hashing (cache matching).

Common ways of normalizing URLs include:

- Sorting query parameters
- Stripping all marketing-related query parameters that don't affect page content.
- Stripping hashes (e.g. #section-1-a)

## Caching Headers

By default, Varnish will only cache things as long as a browser would cache them, as specified by Expires or Cache-Control headers.

Your `.htaccess` file probably already includes `mod_expires`, which adds a `Cache-Control: max age` header to responses based on resource type. 

Varnish will respect this max-age, in our case only caching Wordpress pages up to 4 hours.

```
<IfModule mod_expires.c>
# Enable expirations
ExpiresActive On
# Default directive
ExpiresDefault "access plus 1 week"
# Web pages
ExpiresByType text/html 						"access plus 4 hours"
# My favicon
ExpiresByType image/x-icon 						"access plus 1 year"
# Images and Icons
ExpiresByType image/gif							"access plus 1 month"
ExpiresByType image/png							"access plus 1 month"
# ...and so forth
</IfModule>
```

However, for pages that require server-side, user-specific state, such as password-protected pages or Gravity Form partial form fills (Save &amp; Continue Later), it's best to opt them out of caching altogether:

```php
/**
 * Ensure browser (and Varnish) do not cache the following pages:
 * - Partial Gravity Form fill ("Save and Continue Later")
 * - Password-protected pages
 */
function exclude_pages_from_caching() {

	if ( !empty($_GET['gf_token']) or (!empty($post) and post_password_required($post->ID)) ) {
		// The "Expires" header is set as well as "Cache-Control" so that Apache mod_expires
		// directives in .htaccess are ignored and don't overwrite/append-to these headers.
		// See http://httpd.apache.org/docs/current/mod/mod_expires.html
		$seconds = 0;
		header("Expires: ". gmdate('D, d M Y H:i:s', time() + $seconds). ' GMT');
		header("Cache-Control: max-age=". $seconds);
		return;
	}
}
add_action('template_redirect', 'exclude_pages_from_caching');
```

On the other extreme, there are pages that should be cached for *far longer than 4 hours*--essentually until the Wordpress theme undergoes a breaking change or the page is updated. For these, we check to ensure that no dynamic content exists and then add a weak ETag that depends on the last modified date and theme version.

```php
/**
 * Add ETags to pages without dynamic content
 */
function add_etags_for_longer_caching() {

	// Ensure user isn't logged in
	if ( is_user_logged_in() ) return;

	// Ensure it's a single post or page (not an archive, feed, search page, etc.)
	if ( !is_singular() ) return;
		
	global $post;

	// Ensure it's not a page template with dynamically-generated content
	if ( is_page_template(['course-listings.php', 'events.php', 'news.php']) ) return;

	// Ensure $post is populated
	if ( empty($post->post_content) || empty($post->post_modified) ) return;

	// Ensure it doesn't have any shortcodes with dynamic content
	$content = $post->post_content;
	$shortcodes = [
		'[gc_events', '[gc_photo_albums', '[gc_display_posts', '[gravityform'
	];
	foreach ($shortcodes as $shortcode) {
		if ( strpos($content, $shortcode) !== false ) return;
	}

	// Generate weak Etag using last modified date, theme name, and theme version
	// Remember to update theme version whenever you release a breaking change
	$theme = wp_get_theme();
	$eTag = crc32($post->post_modified . $theme->name . $theme->version);
	header('Etag: W/"'. $eTag .'"');

	// Varnish should take care of returning 304 Not Modified when ETags match, so we don't need
	// to handle that within Wordpress.

}
add_action('template_redirect', 'add_etags_for_longer_caching');
```

## Final thoughts

1. VCLs can be intimidating, but the Varnish documentation is actually very well written, even humorous at times. Don't be afraid to dive in.

2. Don't use HTTP/2 to communicate between the servers in your stack. Only add it at the edge, when communicating with the client. We ran into some knarly bugs due to Apache trying to set HTTP/2 headers when communicating with Nginx.

3. Be sure to tackle the low-hanging fruit performance-wise on your website before worring about Time To First Byte (TTFB). In Wordpress-land, that generally means getting rid of blocking scripts above your content.

Feel free to reach out with questions! I'm a performance nut, and love to chat about this stuff.



