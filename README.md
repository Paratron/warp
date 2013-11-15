Warp
====
The Warp server project aims to create a lightweight HTTP server app that allows you to develop HTML5 canvas games based on the [Phaser engine](https://github.com/photonstorm/phaser) (and of course other engines) on your local machine more easily.

The server should run with nearly zero config out of the box - you simply pick a folder that contains a index.html file and hit the start button - Warp does the rest.

At a later point in the project, debugging and controlling functionalities would be added.


![A screenshot of warp 1 on windows](http://d.pr/i/9yGV+)

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

Download Warp
-------------

There are currently no prepared binaries of Warp available for download.
Please download the project source and create a build by yourself with the steps below.

Building Warp
-------------

To build Warp for your platform from the latest project source, you need to have `nodeJS` and `npm` installed on your machine.

When you have downloaded the project sources to a folder on your harddrive, point your console to that folder and
run the following command:

    npm install grunt grunt-contrib-compress grunt-contrib-watch --safe-dev

This will install `grunt` into the project directory which is needed to build the app. Run this command now:

    grunt

This will create a folder `dist/` with a file `app.nw` in it. This is the compressed project source, ready to be executed
by node-webkit.

Next, download the [node-webkit binary for your system](https://github.com/rogerwang/node-webkit#downloads) and extract it
to your `dist/` folder.

Now, you can simply drag/drop the `app.nw` file onto the node-webkit binary to run the application.