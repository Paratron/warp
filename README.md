Warp
====
The Warp server project aims to create a lightweight HTTP server app that allows you to develop HTML5 canvas games based on the [Phaser engine](https://github.com/photonstorm/phaser) on your local machine more easily.

The server should run with nearly zero config out of the box - you simply pick a folder that contains a index.html file and hit the start button - Warp does the rest.

At a later point in the project, debugging and controlling functionalities would be added.


Project Roadmap
---------------

###Version 1
Implement the HTTP server. Let the user pick a folder from his harddrive and hit the start button to get the files served via HTTP protocol.

###Version 2
Implement project scaffolding. Users can tell the Warp app that they want to create a new game in a specific folder on their harddrive - they
can pick from different project templates (predefined, or self defined) and Warp automatically creates the folder structure based on the template.

###Version 3
Implement connection- and debugging information. Show the list of devices currently connected to the warp server and stream console errors, as well
as custom defined events directly back to the Warp app to collect loading times, framerates and what not.