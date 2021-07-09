---
title: How to Create a Repo-scoped Github Access Token in an Organization Account
date: 2021-07-09 13:32:00 -08:00
description: Used for securely triggering Github Actions from third-party APIs
tags: post
---

Evidently, the only way to trigger a Github Action from a third-party (e.g. headless CMS) is via a [repository_dispatch event](https://docs.github.com/en/rest/reference/repos#create-a-repository-dispatch-event). The only tricky part is that the request must be authenticated by an Access Token.

```shell
curl \
  -X POST \
  -H "Authorization: token {ACCESS TOKEN}"
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/{org}/{repo}/dispatches \
  -d '{"event_type":"rebuild_static_site","client_payload":{"post_id":54}}}'
```

The problem with personal Access Tokens is that, by default, they give access to *every repo you have access to*. When working on private repos in organizational accounts at work, this is a non-starter!

Unfortunately, the only way to generate an Access Token scoped to a repository (public or private) in your organization is via a Github App. Hopefully this won't always be the case, but for now you can follow these steps to set one up in a few minutes:

## Step 1: Create a new Github App

[github.com/settings/apps/new](https://github.com/settings/apps/new)

Give it a short unique name (max length is 34 characters).

Uncheck "Expire user authorization tokens" and leave "Callback URL" blank

![Screenshot of token expiration checkbox](/assets/images/github-app-expire.png)

Uncheck "Active" checkbox under "Webhook" and leave "Webhook URL" blank

![Screenshot of active webhook checkbox](/assets/images/github-app-webhook.png)

Under "Repository Permissions" find "Contents" and enable Read & Write access.

![Screenshot of contents permissions toggle](/assets/images/github-app-contents.png)

Since this Github action is for an Organization Account, you'll need to allow it to be installed on "Any Account". That makes the app Public, but it will not compromise your Access Token, since that's generated when you install it.

![Screenshot of any account radio button](/assets/images/github-app-any-account.png)

Click "Create Github App".

## Step 2: Jot down the App ID and download the Private Key file (PEM)

You'll need these for step #4.

The App ID should be near the top of the page.

![Screenshot of app ID on page](/assets/images/github-app-id.png)

Download the PEM (private key) file.

![Screenshot of link to download PEM file](/assets/images/github-app-private-key.png)

## Step 3: Install the App on your Organization Account

The link to install it should show up in the left-hand menu

<img alt="Screenshot of app installation" width="300" src="/assets/images/github-app-install.png">

![Screenshot of installation screen](/assets/images/github-app-install-screen.png)

Jot down the Installation ID from the App Installation page that shows up after installing. You'll need this in the next step.

![Screenshot of post-installation page](/assets/images/github-app-installation-id.png)

## Step 4: Extract Access Token using Node library

Install [github-app-installation-token](https://www.npmjs.com/package/github-app-installation-token) and use it to extract the repo-specific Access Token from your new Github App.

You'll need the following data:

- App ID (from step #2)
- Installation ID (from step #3)
- Private Key (PEM file in step #2)

There are detailed instructions for using this library in the [README](https://github.com/gagoar/github-app-installation-token#installation-and-use).

After running the script it should give you an Access Token, e.g.

```js
{ token: 'ghs_jksGSQQkmtXSthnGnCsb9AY9yTWU58jhytm6' }
```

## Step 5: You're done!

You can now use this Access Token to trigger a `repository_dispatch` event and fire a Github Action in your organization's private repo.

```shell
curl \
  -X POST \
  -H "Authorization: token ghs_jksGSQQkmtXSthnGnCsb9AY9yTWU58jhytm6"
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/test-inc/test-repo/dispatches \
  -d '{"event_type":"rebuild_static_site","client_payload":{"post_id":54}}'
```
