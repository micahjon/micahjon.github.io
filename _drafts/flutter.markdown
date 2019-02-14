---
title: Building My First App in Flutter
date: 2018-08-31 03:20:00 -04:00
description: Much
---

There's only so long you can read [Hacker News](https://news.ycombinator.com/) without signing up for a VPN service. 

I bit the bullet and signed up for [ExpressVPN](https://www.expressvpn.com/) a few months ago, after a long night in a Shanghai airport where I realized just how powerful a good VPN was in the face of censorship. Overall, I've been pleased with ExpressVPN, and I even bought a new router that I could run it's firmware on and protect my whole Wifi network (take that, Comcast!).

The problem is that some of my housemates love to watch Netflix, and I've had to exclude their devices from using the VPN, since Netflix blocks popular VPN IPs. Opting in/out of VPN service is as simple as logging into our router, but I figured it'd be simpler (and a good learning opportunity) to build a little Android app that let you do it in a single click: opt-in or opt-out.

*Sidenote: as a web developer my first instinct was to build a little PWA. However, after playing around with the ExpressVPN router firmware's JSONRPC API, it soon became apparent that I'd have to spoof the referrer (expressvpnrouter.com) for it to accept my request, something that I couldn't do from a web browser w/out finding a CSRF vulnerability, which I didn't want to build an app around!*

I dabbled in the PhoneGap/Cordova world years ago without much success, and am pleased to say that Flutter was a **MUCH** better experience. *Then again, it could be that I'm just a better programmer ^_^ (shrug emojii)?*

It cross-compiles Dart into a native Android/iOS app, and I'm 