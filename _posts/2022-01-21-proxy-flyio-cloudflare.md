---
title: Caching Fly.io Apps with Cloudflare
date: 2022-01-21 22:30:00 -08:00
description: Sticking Cloudflare in front of a Fly.io Node API
tags: post
---

Services like [Fly.io](https://fly.io/) and [Render](https://render.com/) have generous free tiers for compute and bandwidth, but if you're trying to scale a side project for free, sticking Cloudflare in front of your API can dramatically reduce billable usage and improve performance.

Keep in mind that the free tier of Cloudflare doesn't offer a lot of flexibility as far as caching goes. The [smallest TTL is 2 hours](https://developers.cloudflare.com/cache/about/edge-browser-cache-ttl). That means that unless you want to pay for Cloudflare, you'll need to divvy up your API endpoints (w/ Page Rules) into those that can be cached for 2+ hours and those that shouldn't be cached at all.

*Alternatively, you could cache everything for 2+ hours and then set up a background process (e.g. cron job, Github Action) to purge certain APIs every X minutes. That's probably what I'll end up doing.*

## Setup Node API on Fly.io

First step is simple -- just follow the [Fly.io tutorial to deploy a Node application](https://fly.io/docs/getting-started/node/). 

You'll end up with a URL that looks something like this: <br>
`https://crazy-cats-4499.fly.dev/`

## Setup DNS to Route Subdomain to Fly.io

I'm no expert on DNS entries or SSL certificates, but I was able to find my way by reading through the forums. [This post in particular](https://community.fly.io/t/can-i-use-cloudflare-proxying-with-fly-certificates/1578/6?u=micah_engle-eshleman) was really helpful.

1. Add your domain to Cloudflare. This will take a while since you'll need to wait for your domain's nameservers to propagate. [Full tutorial here](https://community.cloudflare.com/t/step-1-adding-your-domain-to-cloudflare/64309)

2. Set Cloudflare SSL/TLS encryption mode to "Full". This means it will encrypt traffic between itself and the origin/backend (in this case Fly.io).

3. Go to the Fly.io dashboard and find your app, e.g. <br>
`https://fly.io/apps/crazy-cats-4499`

4. Navigate to "Certificates" and click "Add Certificate".

5. Enter a hostname for the certificate. This is a "single-name" certificate and you can [read more about it here](https://support.dnsimple.com/articles/ssl-certificate-names/). In my case, I just wanted to proxy a subdomain to Fly.io, so I entered my subdomain, e.g.
`yesiam.crazyaboutcats.com`

6. Follow the Fly.io instructions to add a CNAME record to your DNS settings in Cloudflare. 

![Add CNAME DNS entry](/assets/images/cloudflare-dns.png)

Make sure the "Proxy status" option is set to "DNS only": grey, not orange!

*BTW, I've tried this several times, sometimes verifying the domain with the `_acme-challenge` CNAME, sometimes not, but it hasn't seemed to make a difference.*

7. Back in Fly.io dashboard, try clicking "Check Again" every few minutes until you see the certificates show up:

![Fly.io DNS interface](/assets/images/flyio-dns.png)

8. Once these certificates show up, you should be able to visit your subdomain and see the response from Fly.io.

![Screenshot of proxied fly.io app](/assets/images/never-trust-cat.png)

9. Once you've verified it's working, go back to the DNS entry in Cloudflare and turn on proxying (grey -> orange). 

At this point, Cloudflare is now proxying requests from clients to Fly.io, and you can do all sorts of things, e.g.
- Automatically compress responses with `gzip`
- Cache content for 2+ hours by setting up Page Rules

---

Hope you found this helpful! If I missed anything, don't hesitate to let me know in the comments.