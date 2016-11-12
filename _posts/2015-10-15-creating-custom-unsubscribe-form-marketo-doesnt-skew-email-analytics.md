---
title: Creating a Custom Unsubscribe Form in Marketo that Doesn’t Skew Email Analytics
date: 2015-10-15 22:41:00 Z
description: How to test a new Marketo unsubscribe form on an external page before
  going live
---

Last week I took on the challenge of migrating our old Forms 1.0 Marketo unsubscribe form from an (ugly) Marketo landing page to our responsive Wordpress site. 

The easy part was creating a new form--with a hidden _Unsubscribed_ field, among others--and embedding it in a Wordpress page. More difficult was _testing the new Unsubscribe link_ in emails. I needed a fully functioning Unsubscribe link that met these requirements:

1.  Link is not global! It only appears on a new "test email template" and doesn't affect existing settings.
2.  Clicking link in email should not increment the email click count.
3.  Unsubscribing by clicking on link and using the form on the Wordpress page should increment the email unsubscribe count.
4.  Email should only contain the new Unsubscribe link defined in the template, not the global Unsubscribe HTML injected by Marketo below it.

**#1** is easy. Just add the link to a new template and test it in a new program. 

**#2** involves adding the _mktNoTrack_ class the the link. This means it will not be routed through your subdomain (e.g. go.goshen.edu) which tracks link clicks and associates them with leads and email campaigns. 

**#3** is tricky, and I couldn't find documentation on it. Add a `mkt_tok=##MKT_TOK##` url parameter to the link. Without this the form will still work, but Marketo needs the mkt_tok parameter to associate the unsubscribe action to the email. 

**#4** is a hack. The global Unsubscribe HTML will be added to the email unless it contains the \{\{system.unsubscribeLink\}\} token. Create an tiny invisible link with this token, e.g. 

```handlebars
{% raw %}
<!-- Prevent injection of Unsubscribe HTML since we're using a custom link -->
<a href="{{system.unsubscribeLink}}" style="display: none; font-size: 0; color: transparent"></a>
{% endraw %}
```

and be sure to comment it! 

_**Note:** #4 is not necessary if you choose to replace the global Unsubscribe HTML with your new link. It's super handy for testing the new link ahead of time though._

* * *

I'm new to Marketo development and this is my first post on the topic. I'd love to hear your feedback.