---
layout: post
title: "Deployment with OpenWrap"
date: 2011-02-01 12:46:09 -0800
comments:
categories: deployment .NET tooling
---

This post is a brief, hand-wavey outline of my efforts to integrate and abuse OpenWrap for the purposes of deployment automation in my shop. I began working on this post before starting the actual process of integrating OpenWrap and have updated as I&rsquo;ve progressed. The goal should be that, when complete, it will provide an introductory outline of what a newcomer to OpenWrap (as I consider myself, prior to this post) will want to know/learn in order to competantly grapple with the topics contained herein.

I will begin by discussing some assumptions about the environment for this exercise (as they pertain to my particular situation), then talk about where my shop was before integrating with OpenWrap and what our current deployment process consists of. Next, I will outline where I _want_ to be once fully integrated with OpenWrap. Finally (the important stuff), I will provide purposefully vague play-by-play of the conversion process (as, neccesarily, each shop&rsquo;s needs and constraints will differ.. so excessive preciseness in the blog post will only serve to, ultimately, mislead you, the gentle reader) starting from a &ldquo;vanilla non-OpenWrap&rsquo;d&rdquo; ASP.NET MVC 2.0 webapp.

It&rsquo;s key to point out that, as far as I can surmise, using OpenWrap for:

1.  Deployment automation
2.  Packaging ASP.NET MVC projects

.. is a massive abuse of it&rsquo;s intended purpose. I make no warranties as to the fitness of the process outlined herein and fully expect to inspire the Wrath of Seb as a result (have you ever seen how he browbeats the NuGet people?).

### Some Assumptions

This post assumes that you&rsquo;re working in a MS.NET environment deployed to some variant (most likely Server) of the Windows OS ecosystem. We&rsquo;re still on Server 2003 (with a migration to 2008R2 in the next 12 months). It&rsquo;s not-at-all clear to me what the Mono/Linux story is for OpenWrap, so I make no warranty that this process can be adapted for such an environment. My shop is still .NET 2.0/3.5SP1-based, so that is the point from which I&rsquo;m starting in this post (.NET 4.0 is also on the 12 months plan, heh). Also, my actual production servers exist on a DMZ that is not domain joined and requires copious amounts of red-tape to be waded-through in order to open ports back into some of office backoffice machines in non-DMZ&rsquo;d parts of our corporate intranet.

### Our Pre-OpenWrap Deployment Process

Our current setup, roughly, looks like this:

1.  Devs work and check-in to our mercurial repo, as needed
2.  For every checkin, a jenkins build runs. The complete webapp project directory (bins, src, views, etc), post-build, is published as an artifact
3.  Once we&rsquo;re ready to deploy to prod, we have a special, manually triggered, jenkins build that will take the artifacts of the most recent, successful, build and do some config replacement for the prod environment (it&rsquo;s configured for dev/test by default) and package the result into a zip. The resulting zip file can be decompressed on the root of the drive on our application servers (so it unpacks into Inetpub/wwwroot by default). This zip file is published as the artifact of the build
4.  Whoever is doing the deployment (we&rsquo;ll call them &ldquo;Ops&rdquo;) will go to the jenkins page and download the zip artifact from the last step to their local machine
5.  Ops will then log into the application servers via RDP and copy the zip file onto the machine via the &ldquo;Local Resources&rdquo; exposure of their local hard drive

We&rsquo;ve found that step 4 is the killer, as it appears to take ~15 minutes of manual time to copy the resource across the intranet. As noted above in the &ldquo;Some Assumptions&rdquo; section, the app servers are on a DMZ and all ports back into the intranet are closed by default (including network file shares) and the servers are _not_ domain-joined. My suspicion is that this method of copying large files (the prod deployment zip is ~35MB, currently) across the Local Resources pipe (or, perhaps more aptly, straw) is sub-optimal. I&rsquo;d like to test how long it&rsquo;ll take when done via HTTP or other methods. I get a feeling that SMB fileshares will be a non-starter, here, as it appears to require the opening of 4-or-more ports and not to mention the whole Active Directory component that isn&rsquo;t present on servers in the DMZ. I&rsquo;d love to check out rsync, but I get the impression that it&rsquo;s support is kind of flakey on Windows. So I&rsquo;m interested in seeing what an HTTP transfer of an equivelant size, from the intranet, will look like time-wise.

But another component of what&rsquo;s so horrible about Step 4 is not just the time, but the &ldquo;disconnect&rdquo; that it creates in what is otherwise a mostly fluid process. That is 15 minutes that an Ops person has to sit there and twiddle their thumbs waiting for the process to complete. It&rsquo;s easy to get distracted and not check back until well after the copy has completed. I would like to get to an end-to-end automated process so that, regardless of how long it takes, we can click a button and know that the deployment will be finished, eventually, without dependence upon human intervention. An email notification of completion would be nice as well, but not neccesary.

### Where we want to be

1.  Still have the jenkins build(s) as detailed above
2.  Chances are the manually-triggered &ldquo;prod config/zip&rdquo; jenkins build (detailed above in step 3) will be modified to also include publishing the resultant artifact to an intranet-based OpenWrap repository server. OpenWrap seems to support network fileshare-based repositories out-of-the-box, but I think this&rsquo;ll be a non-starter for my shop based on the constraints of the DMZ outlined above. So I want a web-server based repository. The solution is quite simple (basically, we do both), and is detailed below (duh)
3.  Open ip/ports from my production servers to the internal OpenWrap repository
4.  From here, two options:
5.  Setup scheduled tasks on the production servers that periodically checks our internal repo for a new package and updates, accordingly. A polling based approach.
6.  Add support in the app, itself, to allow it to spin off a new process to check for updates via `o.exe` and update itself, as needed. We have a place in our app where this could live, already.
7.  Finally, some kind of completion notification once the new site wrap has been installed.

Really the goal is to drastically reduce the amount of needed human intervention, in order to successfully deploy, to a couple of mouse clicks. Reducing the speed of the deployment would be nice, but is not essential (especially if we do discover that we are severely hamstrung by a bottleneck in throughput across the intranet between the DMZ and backoffice machines where the OpenWrap will live).

### Step 1: Make The Web Application A Wrap

So, first things first, we have to set up an OpenWrap &ldquo;skeleton&rdquo; package into which we&rsquo;ll place the source of the application that we&rsquo;re trying to make into a deployable artifact (in OpenWrap parlance, this is called a &ldquo;wrap&rdquo;, although we&rsquo;re misappropriate the framework a bit in order to have it do our evil bidding). In all places below, I use `projectname` as a standin for whatever you wanted to name your wrap, so please substitute appropriately.

I created a new &ldquo;wraps&rdquo; directory, inside of which I intend to place any packages I create. I think initialized my new project in there.

    mkdir wraps
    o init-wrap projectname

Since my environment is Windows Server 2003 based (and I&rsquo;ve had problems dealing with the symbolic links/junctions that OpenWrap uses by default), I make sure to disable symbolic links as detailed [here](https://github.com/openrasta/openwrap/wiki/Package-descriptor). Open up the `projectname.wrapdesc` in your newly created package directory and add:

    use-symlinks: false

to the config.

After this, go ahead and copy in (or create) the project that you want to encapsulate in the wrap to the `src/` directory in your package skeleton. After that, enter:

    o init-wrap -all

from the CLI to have OpenWrap hook into your project file (it does this by changing the default compiler target in your .csproj). All of the intracacies of this process are beyond the scope of this blog post, so a good place to start, if you want to learn more, is [here](https://github.com/openrasta/openwrap/wiki).

After this, you should now have your project set up as a wrap (in the default configuration). You should be able to do:

    o build-wrap -quiet

from the CLI and get a .wrap file as output. This is actually just a zip, which you can rename/decompress to check out the contents of in order to get some understanding of how it packages your build artifacts by default.

For me, though, this wasn&rsquo;t the end of the story&hellip;

### Step 1.5: Shoehorning an ASP.NET MVC Webapp Structure Into OpenWrap

By default, it appears that OpenWrap is setup to work with projects that aren&rsquo;t particularly finnicky about where the bins and resources are placed (or, perhaps more appropriately, are structured to lump everything together in a single build directory). Things like Class Library projects and CLI apps come to mind, here. This works pretty well for Class Libraries (and perhaps even typical CLI projects), but it doesn&rsquo;t work (for me), out of the box, for ASP.NET apps (sadly). Of course, it should be noted that I&rsquo;m not saying that OpenWrap is fundamentally incapable of dealing with these projects, but it seems that it doesn&rsquo;t package them correctly out of the box (whether the remedy is education on how to properly configure OpenWrap or a feature implementation is beyond me at this time).

My solution, in this case, is to just hand-roll my own `.wrap` that abides the constraints required to have a running ASP.NET MVC site (all binaries in `/bin` under the root, expose `Views`, `Content`, `Scripts`, have a `Default.aspx` and `Global.asax` in the root, etc). For now, this is easier than bruising my brain trying to figure out how to make OpenWrap do this via configuration.

I&rsquo;m not sure how much of the issue is solvable by configuration in the .csproj and how much is a current limitation of OpenWrap, but suffice to say that this is something I wanted to talk about so that it can either 1) be brought up as a possible feature/fix and use case for OpenWrap or 2) be solved by way of education. I&rsquo;m also painfully aware of the fact that I&rsquo;m taking OpenWrap way outside of it&rsquo;s intended comfort zone as part of what I&rsquo;m doing in this blog post.

Obviously, this situation is a _big_ your-mileage-may-vary kind of thing, but to give you an idea of what I did to make an ASP.NET MVC package nicely into a wrap:

        # this was derived from:
        # http://snippets.dzone.com/posts/show/6409
        def get_newest_wrap(dir)
            matching = /.*wrap$/
            files = Dir.entries(dir).collect { |file| file }.sort { |file1,file2| File.mtime(file1) <=> File.mtime(file2) }
            files.reject! { |file| ((File.file?(file) and file =~ matching) ? false : true) }
            files.last
        end

        def get_version_from(path)
          f = File.open path
          lines = f.readlines
          f.close
          lines.last.sub(/\.\*/,'')
        end

        @siteDir = 'bin-net35'
        @toolsDir = '' # where I have some bin tools I use during builds
        @targetProjectName = 'My.Asp.Net.Project'
        desc "hand-roll a wrap for an ASP.NET MVC site"
        task :drybuildwrap do
          mkpath 'working'  
          version = get_version_from ".\\version"
          ts = Time.now.to_i.to_s # being lazy and using a unix timestamp
                                  # as the build number. it works, i guess.
          pkg = "myaspnetproject"
          wrapFile = "#{pkg}-#{version}.#{ts}.wrap"
          Dir.chdir 'working'
          mkpath @siteDir

          # files needed in the root of the app, besides bin
          rootFiles = ['Default.aspx', 'Global.asax', 'robots.txt', 'Web.config', 'Content', 'Scripts', 'Views']
          rootFiles.each do |f|
            cp_r "..\\src\\#{@targetProjectName}\\#{f}", @siteDir
          end
          # /bin
          cp_r "..\\src\\#{@targetProjectName}\\bin", @siteDir

          # needed OpenWrap files
          cp_r "..\\version", "."
          cp_r "..\\#{pkg}.wrapdesc", "."
          mv @siteDir, 'bin-net35'

          # tools dir -- some stuff needed to bootstrap the self-updating
          # functionality .. covered in Step 4.5 below
          mkdir "tools"
          cp_r "..\\..\\..\\Tools\\7z\\7z.dll", "tools"
          cp_r "..\\..\\..\\Tools\\7z\\7z.exe", "tools"
          cp_r "..\\rakefile.rb", "tools"

          # Finally, let's create our wrap
          sh "..\\..\\..\\Tools\\7z\\7z.exe a -tzip -r ..\\#{wrapFile} *"
          Dir.chdir '..'
          rmtree 'working'
        end

Pretty wild, I know.

### Step 2: Setup An OpenWrap Repository To Publish To

This was a real head-scratcher for me, at first, so I asked about it on the OpenWrap mailing list. I was looking for a full HTTP implementation of an OpenWrap server and, seeing only a stub on github, I went to harass Seb for the full source. The thread is [here](http://groups.google.com/group/openwrap-devel/browse_thread/thread/ad4f5329f9411e81). His solution was pretty elegant. From the thread (where he&rsquo;s speaking about what he does for the main OpenWraps repo):

> As for wraps.openwrap.org, I use something much simpler. I use a file share repository to write packages from teamcity, and on the read side i simply share the same folder as an http folder, that works out of the box as is, so if you&rsquo;re just looking at exposing the read side, you can do that now already.

So, it&rsquo;s pretty simple. With this in mind, I set up two servers:

1.  `file://buildserver/openwraps/myaspnetsite` &mdash; A fileshare based repository server that the build server can publish to after a successful build
2.  `http://buildserver` &mdash; A read-only repository that is exposed via IIS 6 directory listing magic (And do remember to add the `.wraplist` and `.wrap` to your MIME-types if using IIS 6, as I am :/ )

You can find some documentation on setting up OpenWrap repositories [here](https://github.com/openrasta/openwrap/wiki/Package-repositories). The actual, esoteric details of your hosting needs are something that I can&rsquo;t give specific guidance on.

For me, above setup gives the flexibility I need for my deployment environment (where I can open a single port on a machine in my backoffice intranet to the DMZ servers), while allowing me to easily publish packages in the backoffice environment (where our build machine lives and the rules are somewhat more lax).

### Step 3: Integrate OpenWrap Publishing Into Build Process

This one I will leave as an exercise for the reader. Personally, I&rsquo;m using Jenkins (née Hudson) for our builds (with most of the action in rake scripts). I&rsquo;ve written some tasks to hand-roll the .wrap (as detailed in Step 1.5 above) and publish that to my fileshare repository.

Bottom line: You need to start producing and publishing wraps as part of your regular build process. Depending on how pervasive your deployment automation will be (just for prod? why not your continuously updated UAT/Staging server, too?) you could continuously push to one repository, while only &ldquo;selectively&rdquo; pushing to another, &ldquo;production-only&rdquo; repository when you&rsquo;re ready to deploy via some manually triggered automation. Which approach is appropriate to your situation will depend, largely, on Step 5 below.

### Step 4: Setup On The Application Servers

After doing the neccesary legwork on my DMZ servers (like opening the port to my read-only HTTP server in the backend and setting up the OpenWrap shell), I have to a few things.

First, I need to make OpenWrap aware of the repository from which it can fetch the wrap it needs. This was as simple as:

    o add-remote myaspnetsite http://buildserver

As outlined in Step 2 above, this corresponds to the read-only server that I exposed for my DMZ servers to pull from.

Next, I will initialize a stub project that I&rsquo;m going to use to &ldquo;host&rdquo; the application that I want to deploy via OpenWrap. Finding the place where I want it to be (like `D:\Inetpub\wwwroot` or what-have-you), I did:

    o init-all myaspnetsite_prod

OpenWrap will give me some static about setting up the project structure. I can now go into there and set things up.

    cd myaspnetsite_prod

As above in Step 1, my particular situation warrants that I use `use-symlinks: false` in my `myaspnetsite_prod.wrapdesc` file. With that out of the way, I can do:

    o add-wrap myaspnetsite -Anchored

And, if everything&rsquo;s wired up properly, OpenWrap will download and unpack your package within the `myaspnetsite_prod/wraps/myaspnetsite` directory. If any of the stuff from previous steps is messed up (like your publishing or hosting for the HTTP repository), you&rsquo;ll have some problems here.

The `-Anchored` flag tells OpenWrap that the dependency you&rsquo;re adding you should be unpacked in a &ldquo;visible&rdquo; location (ouside of the `_cache` dir). Normally this is so that you can check that dependency in, but it serves us here by exposing it in a fixed location (independant of the version). More info on package anchoring is available [here](https://github.com/openrasta/openwrap/wiki/Package-anchoring). From here, you should be able to point IIS at the `myaspnetsite_prod/wraps/myaspnetsite` folder and it will work (provided your .csproj has its references, etc, working right and nothing squirrely happens with how you&rsquo;re reworking the wrap.. this is some brittleness that I&rsquo;ve brought on myself, here.. I hope in the course of discussing this process, a more elegant solution can be sussed out).

### Step 4.5: A Brief Digression On The Topic Of Updating ASP.NET Sites

The whole point of this exercise is to get to a point where, once we have the OpenWrap infrastructure in place, updating to newer versions will be a snap. This is complicated by a major, blocking issue: OpenWrap won&rsquo;t &ldquo;re-anchor&rdquo; updated packages if any of the files in the old package directory are locked. This is the case because OpenWrap updates anchored packages by removing the old directory and replacing with a new one (which is pretty sensible in most cases). This isn&rsquo;t neccesarily what we want in ASP.NET land, though, we where can just unzip a new install over the old one and, provided there isn&rsquo;t any weirdness with renamed assemblies, etc, ASP.NET will pick up the file changes on the next request and recycle the app automagically. And, while we can unzip over a running application without complaint from IIS, we cannot _nuke_ the directory of a running without, at the least, taking downt he web site (which may cause false alarms with your application monitoring infrastructure).

I get the impression that there&rsquo;s a lot of people who are used to stopping the web site in order to do updates. I&rsquo;ve never been one of those people (unless there&rsquo;s file locking issues that prevent a clean unzip, in which case you have no choice but to stop the site). With this in mind, I prefer a deployment process that involves unpacking a zip and letting it override an existing, live app. If this is a grossly irresponsible perspective to take, I&rsquo;d like to hear about that (I mean, as much as anyone likes to hear &ldquo;you&rsquo;re an idiot!&rdquo;).

Anyways, back to the issue at hand: How to work around OpenWrap&rsquo;s design limitation in terms of updating a &ldquo;live&rdquo; site? More rake scripting, of course!

For me, the strategy is as follows:

1.  I decided to modify the rake task outlined above in Step 1.5 to include an additional rakefile (containing the snippet below) and a CLI unzipping utility (7zip, if you must know) in the deployable artifacts for my wrap.
2.  The rakefile that is now embedded in the `.wrap` contains logic to:
3.  Find out what the version # is of the &ldquo;newest&rdquo;, locally held wrap for our package that we want to continuously update
4.  Check the remote repository and, using `o list-write` and some output parsing magic, find out what its newest version of our target wrap is
5.  If the remote&rsquo;s newest is not equal to ours (unlikely that we&rsquo;ll slidebackwards in revisions and maybe even desirable, at times, if so (like a rollback scenario)), then:
6.  Run `o update-wrap` which will, of course, fail to anchor our package (but still download the `.wrap` for us)
7.  Having downloaded a new version, we now find the filename of the newest version of our package (which should be the new one)
8.  We copy out our CLI unzip&#8217;ing util and then use it to unzip our new package (you have to copy it out, otherwise it&rsquo;ll explode when trying to overwrite itself)

I ended up with a script something like:

        # This is pretty lame and depends on the impl of o.exe's CLI output.. have to
        # keep an eye peeled for changes, here
        def newest_version_of_package_on_remote(pkg, repo)
          output = `o list-wrap -Query #{pkg} -Remote #{repo}`
          line = output.split("\n").last
          line = line.sub(/^.*available: /,'').sub(/\)$/, '')
          line.split(", ").last
        end

        task :hotupdate do # this is the task we'll run from a scheduled task on the app server
          pkg = "myaspnetproject"
          repo = "myaspnetprojectrepo"
          Dir.chdir "..\\.." # we're executing from somerepo\wraps\myaspnetproject\tools .. 
                             # need to move up the somerepo\wraps\ dir
          localWrap = get_newest_wrap(Dir.pwd).sub(/#{pkg}-/, '').sub(/\.wrap/, '')
          newestWrap = newest_version_of_package_on_remote pkg, repo
          if localWrap == newestWrap
            puts "at latest"
          else
            puts "updating..."
            sh 'o update-wrap'
            wrapFile = get_newest_wrap(Dir.pwd)
            Dir.chdir pkg
            toolsDir = "toolsTmp"
            mkdir toolsDir
            cp_r "tools\\7z.exe", toolsDir # have to copy out 7zip from the tools dir, so it doesn't
            cp_r "tools\\7z.dll", toolsDir # barf when trying to overwrite itself
            sh "#{toolsDir}\\7z.exe x -y -tzip ..\\#{wrapFile}"
            rmtree toolsDir
          end
        end

### Step 5: Flip The Switch

If you made it here successfully, that means that you&rsquo;re worked out the details for how to facilitate OpenWrap&rsquo;s use as a deployment framework for your project. Now you&rsquo;ll have to figure out how to put it on auto-pilot. The key will be to get to the point where you won&rsquo;t have to log into your application servers _at all_ to do a deployment.

My personal preference is set up a scheduled task on the deployment server that polls for updates on a regular, frequent basis. This way, my deployment choke point is now the act of pushing packages to that repository that is regularly polled (something that I can automate pretty easily as part of my existing build infrastructure). You can easily invert this approach by automating the pushing of packages to your repo and making the update poll be the manually triggered step (via added functionality in your app or some existing tool/server to kick off processes/scripts on your production server).

I use the `:hotupdate` rake task outlined above, executed every five minutes, to check for new versions of our application and handle the downloading and unzipping on an as-needed basis.

### Conclusion

This post is a skeletal depiction of a process that I&rsquo;ve worked through in order use OpenWrap for automating my deployment process (which is currently only automated up-through the point of package generation. Actual deployment on the application server is manual and a hassle). I kept things vague on purpose, as I feel like an overly detailed post would be less valuable (due to be the tendency to get bogged down in semantics and the fact that every environment is different).

There are a lot of details to work out, but I think the steps outlined above serve as a good place to start for getting things up and running. There&rsquo;s a pretty good chance that I&rsquo;m doing something Really Wrong, so I&rsquo;m interested in having a discussion about what could be done to improve this process.

With the caveats aside, there are two key points in the OpenWrap workflow where I, pretty much, opt-out in favor doing things a bit differently to suit my own laziness and preferences:

1.  When building a new wrap, I roll one by hand (Step 1.5) using a rake script, so that I don&rsquo;t have to bother with wrapping my brain around the configuration (see what I did there?).
2.  When trying to update the wrap (Step 4.5), I go through the motions (in order to have OpenWrap download the newest `.wrap` for me), but anticipate the re-anchoring of the new version failing (because IIS has locked the directory) and will go ahead and do a manual upgrade-in-place (by unzipping the `.wrap` over the existing anchor, which _will_ work, most of the time, unlike a delete-and-replace). This may or may not be a bad thing and exposes you to certain Troubles as your application evolves naturally over time (assembly conflicts due to renames, to name just one of many.. not to mention the possibility for `.dll` or other files not being updated due to IIS&#8217; rather eccentric and unpredictable file-locking practices). This whole thing stems from the desire to avoid taking down the site/IIS when I can help it.

I would love to have a discussion around these issues and see if there&rsquo;s a possibility to evolve the OpenWrap framework to handle these scenarios/approaches more gracefully, if they&rsquo;re deemed safe enough, valuable, etc.

I hope this post has been valuable for you in your quest to be a Lazier Developer, because that&rsquo;s _really_ what automation about, isn&rsquo;t it?
