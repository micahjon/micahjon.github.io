---
title: Loading jQuery Immediately before Gravity Forms
date: 2015-05-18 22:51:00 Z
description: A performance optimization for ajax-enabled Gravity Forms
redirect_from: "/loading-jquery-in-the-footer-with-gravity-forms/"
---

Loading jQuery asychronously or in the footer on pages with ajax-enabled Gravity Forms is tricky because the form relies on inlined jQuery-dependent scripts that immediately follow it in the DOM:

![Inline jQuery-dependent Gravity Form scripts]({{site.baseurl}}/assets/images/Screen Shot 2016-10-31 at 12.55.36 AM.png)

In this case, the typical `gform_init_scripts_footer` solution doesn't work, because moving jQuery to the footer would break these inline scripts. 

Another solution I've run across uses `gform_cdata_open` and `gform_cdata_close` to wrap these inline scripts in a function that's called once jQuery has been loaded. However, this clever technique can generate errors on payment forms (e.g. `Uncaught ReferenceError: gf_global is not defined`) due to the scripts being run after _DOMContentLoaded_ instead of before as Gravity Form expects. 

Ultimately, the most reliable (and performant) solution I've found is to inject a synchronous jQuery `<script>` _immediately_ before the inline scripts using the `gform_cdata_open` hook once.

```php
/**
 * Inject synchronous jQuery dependency before the Gravity Form inline scripts
 */
function inject_jquery_above_gravity_form( $content = '' ) 
{
	// keep track of jquery so it's not loaded twice!
	global $jquery_already_injected;
	
	if ( !isset($jquery_already_injected) ) {
		
		$jquery_already_injected = true;

		// End inline script
		$content .= "</script>\n";

		// Inject jQuery
		$content .= "<script src='/path/to/jquery.min.js'></script>\n";		

		// Start inline script again
		$content .= "<script>";
	}

	return $content;
}
add_filter( 'gform_cdata_open', 'inject_jquery_above_gravity_form' );

/**
 * Enqueue jQuery in footer unless it's already been injected above Gravity Form.
 * In this case, enqueue a fake version to trigger dependent scripts, and then remove this fake version.
 */

function enqueue_jquery()
{
	global $jquery_already_injected;

	// jQuery has not been loaded
	if ( !isset($jquery_already_injected) ) {
		wp_enqueue_script('jquery');
	}
	// jQuery has already been loaded above a Gravity Form
	else {
		
		// Enqueue fake script to trigger dependencies
		wp_enqueue_script( 'jquery', '//fake-jquery-script.js', [], null );

		// Remove this fake script's HTML before it's actually injected into the DOM
		function gc_remove_fake_jquery_script( $tag ) {
			$tag = ( strpos($tag, 'fake-jquery-script') !== false ) ? '' : $tag;
			return $tag;
		}
		add_filter( 'script_loader_tag', 'gc_remove_fake_jquery_script' );
	}

}
add_action('wp_footer', 'enqueue_jquery', 9);
```

Your comments and feedback are welcome!
