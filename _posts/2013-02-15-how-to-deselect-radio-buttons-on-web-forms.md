---
published: true
---
## How to deselect radio buttons on web forms

Today I filled out yet another poorly built online survey. This penultimate page asked for my academic major: 

![Original Form]({{site.baseurl}}/_posts/Screen Shot 2016-10-30 at 7.34.51 PM.png)

Notice the three groupings of radio buttons. One in case you're undecided, one for social science majors, and one for folks (like me) in the hard sciences.

Just for fun, let's select one of each:

![Filling in multiple radio buttons]({{site.baseurl}}/_posts/Screen Shot 2016-10-30 at 7.37.30 PM.png)

Cool, but now we want to be serious and just select one major. Hmm, we can't deselect radio buttons!

At this point the frustrated user who accidentally clicked on the wrong button does one of the following:

1. Throws up their hands and moves on, leaving the 3 unintelligible selections in place.
2. Refreshes the form and fills in everything a second time. (nasty if this section was near the end).
3. Googles furiously for how to deselect radio buttons (and writes this article).

## Here's a quick fix in Google Chrome

_Using another browser? No worries, the steps are nearly identical in Firefox, Safari and Internet Explorer_.

We'll be using a single line of javascript to identify the radio button and deselect it.

1.  Right click on the radio button and select _Inspect_. Google Developer Tools will appear at the bottom of the screen. 

![Right click on radio button, Inspect]({{site.baseurl}}/_posts/Screen Shot 2016-10-30 at 7.38.46 PM.png)

2.  Notice the <input> tag that represents this radio button has a unique id of "choice_31_8_0". 

![Highlighted tag refers to this radio button]({{site.baseurl}}/_posts/Screen Shot 2016-10-30 at 7.46.05 PM.png)

Double click to select this id, and copy it.

![Double click id to select the unique id of the radio button]({{site.baseurl}}/_posts/Screen Shot 2016-10-30 at 7.48.01 PM.png)

3.  In the Console tab, paste the following code. Replace "choice_31_8_0" with your radio button's unique id. 

{% highlight javascript %}
document.getElementById("choice_31_8_0'").checked = false;
{% endhighlight %}

![In Console tab, paste the above javascript snippet]({{site.baseurl}}/_posts/Screen Shot 2016-10-30 at 9.43.41 PM.png)

4.  Press enter to run code! This should deselect your radio button. 

![Press enter to run code. Radio button should be deselected]({{site.baseurl}}/_posts/Screen Shot 2016-10-30 at 9.45.18 PM.png)


## What is this code doing?

### The HTML

	<input name="input_8" type="radio" value="No, I'm still deciding" id="choice_31_8_0" tabindex="3">

The _\<input\>_ tag is used for user inputs in web forms. This particular tag has _type= "radio"_ (radio button) and _id = "choice_38_8_0"._

### The Javascript

{% highlight javascript %}
document.getElementById("choice_31_8_0'").checked = false;
{% endhighlight %}

This script looks within the _document_ (webpage) for the first element with _id_ equal to _choice_31_8_0_, and sets the _checked_ property of this object to _false_.
