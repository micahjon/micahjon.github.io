---
title: How to Move a CenturyLink Fiber Modem & ONT
date: 2022-02-09 23:50:00 -08:00
description: Lessons learned from moving my first fiber cable
tags: post
---

Last week I switched from Comcast to CenturyLink. 200 mbps upload and download for $50/month feels like a good deal, and the service has been great so far.

I've ran a good bit of ethernet and coax cable wire over the years, but fiber was new to me. Evidently, it's much more finicky:
- You can't bend it as much
- You're not supposed to look into the end of the cable (lasers?)
- You can't get the end of the cable dirty

## Moving the Fiber, Modem & ONT downstairs

Just to recap, the ONT is the box that sits between your fiber cable and your modem/router combo. 

`Fiber cable <-> ONT box <-> Ethernet cable <-> Modem/Router box`

### 1. Unplug Ethernet from ONT

Before unplugging the Ethernet cable from your ONT, **make note of which Ethernet port is being used**. 

Evidently, the ONT Ethernet port matters (it's not like a switch). CenturyLink can use a single ONT to service multiple customer modems. You'll need to plug your modem back into the same Ethernet port on the ONT after moving it, or your internet won't work.

I learned this the hard way... thought I screwed up the fiber cable only to have a CenturyLink guy fix my internet in 3 seconds by plugging the modem into the chosen Ethernet port on the ONT.

### 2. Unplug Fiber from ONT and protect the end of the cable

Here's a [Reddit thread](https://www.reddit.com/r/centurylink/comments/ko12be/how_do_you_unplug_the_fiber_cable_on_the_ont_box/) on unplugging the fiber cable from your ONT.

Before you unplug the cable, have a plan for how to protect the end of it while you're moving it to the new location. In my case, I did several things:
- Used a sticky note and some tape to wrap a paper tube around the end of the cable, extending past the end to protect the tip. This way nothing is touching the tip if you set it down.
- Later when running the wire through the wall, this paper tube got in the way, so I took it off and replaced it with a tape tube make of painter's tape that tapered to a cone at the end. This was much less sturdy, but kept the cord thin enough it went through the hole in the wall easily.
- Stick the end of the cord in a ziplock bag when you're setting it down so it doesn't get dirty (especially if you're outside). Of course, you still need to protect the end of the cord first.

Unplugging the cable is actually pretty easy. Just pull on the squarish green cable terminator, not on the cable itself. Pull it straight out with a steady hand -- don't bump it against the ONT! Then protect the tiny exposed fiber end w/out touching it or looking into the end of the cable.

### 3. Run Fiber to new location

This part will depend a lot on the job, but in my case the steps were:
- Pry silicon caulk off the hole where fiber enters house
- Pull fiber outside of house (put a bag on the end to keep it from getting dirty)
- Drill hole into different part of the house (e.g. my basement)
- Very carefully push protected cable end into that hole, then pull it all through from the inside
- Seal up holes with exterior-rated silicon caulk

### 4. Hook it all back up

Remember to connect the modem to the same Ethernet port on the ONT that it was connected to before. 

Good luck!