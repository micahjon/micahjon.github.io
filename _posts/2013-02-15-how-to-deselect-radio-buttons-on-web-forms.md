---
published: true
---
## How to deselect radio buttons on web forms

Today I filled out yet another poorly built online survey. This penultimate page asked for my academic major: 


![Original Form]({{site.baseurl}}assets/images/form1.jpg)

Notice the three groupings of radio buttons. One in case you're undecided, one for social science majors, and one for folks (like me) in the hard sciences.

Just for fun, let's select one of each:

![Filling in multiple radio buttons]({{site.baseurl}}assets/images/form2.jpg)

Cool, but now we want to be serious and just select one major. Hmm, we can't deselect radio buttons!

At this point the frustrated user who accidentally clicked on the wrong button does one of the following:

1. Throws up their hands and moves on, leaving the 3 unintelligible selections in place.
2. Refreshes the form and fills in everything a second time. (nasty if this section was near the end).
3. Googles furiously for how to deselect radio buttons (and writes this article).

## Here's a quick fix in Google Chrome.

We'll be using a single line of javascript to identify the radio button and deselect it.

1.  Right click on the radio button and select _Inspect Element_. Google Developer Tools will appear at the bottom of the screen. ![Right click on radio button, Inspect Element]({{site.baseurl}}assets/images/form3.png)

2.  Notice the <input> tag that represents this radio button has a unique id of "choice_11_0". ![Highlighted tag refers to this radio button]({{site.baseurl}}assets/images/form4.jpg)
Double click to select this id, and copy it. ![Double click id to select the unique id of the radio button]({{site.baseurl}}assets/images/form5.jpg)

3.  In the Console tab, paste the following code. Replace "choice_11_0" with your radio button's unique id. [js]document.getElementById("choice_11_0").checked = false;[/js] ![In Console tab, paste this javascript snippet]({{site.baseurl}}assets/images/form6.jpg)

4.  Press enter to run code! This should deselect your radio button. ![Execute code. Radio button should be deselected]({{site.baseurl}}assets/images/form7.jpg)


## What is this code doing?

### The html:

<pre><input id="choice_11_0" tabindex="11" type="radio" name="input_11" value="No, I'm still deciding" /></pre>

The _input _tag is used for just about any user input in web forms. This particular tag has _type_ _= "radio"_ and _id = "choice_11_0"._

### The javascript:

[js]document.getElementById("choice_11_0").checked = false;[/js] This script looks within the _document_ (webpage) for the first element with _id = "choice_11_0"_, and sets the _checked_ variable of this object to be _false_.

## Just for fun: Deselecting EVERY radio button!

Give this a shot! [js]var inputs = document.getElementsByTagName("input"); for(var i = inputs.length-1;i>=0;i--){ if(inputs[i].getAttribute("type")==="radio"){ inputs[i].checked=false; } }[/js] _source: http://superuser.com/questions/19024/un-select-a-radiobutton_
