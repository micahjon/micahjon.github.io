!function()
{
	var images = document.querySelectorAll('#post-body p > img');
	for (var i = 0; i < images.length; i++) {
		// Only apply to wide images
		if ( images[i].clientWidth < 520 ) {
			return;
		}
		var wrap = images[i].parentNode;
		if ( wrap.nodeName === 'P' ) {
			wrap.classList += ' img-wrap';
		}
	}
}()