---
layout: post
title: "An Introduction to machine.javascript"
date: 2010-02-17 12:06:31 -0800
comments: true
categories: javascript web
---

This is the first in a series of [hopefully many] blog posts on the topic of [machine.javascript](http://github.com/machine/machine.javascript), an open source framework for helping developers create testable, deployable and well-factored UIs on the client in JavaScript. It covers some of my exposure to tools in this space and an overview of what `machine.javascript` consists of and how to use it. This post is tightly coupled to [Part 2](/javascript/mvc/2010/02/18/An-Introduction-To-Machine-Controller-Part-2.html) in the series and each should not be read without considering the context of the other.

### My experience with JavaScript MVC

As I&rsquo;ve gotten involved in my professional and personal capacities with rich, client-based UIs in te browser, one of the most indispensible patterns I&rsquo;ve had at my disposal would have to be &ldquo;MVC&rdquo;. I put MVC in scare-quotes because it is, in my opinion, one of the most overloaded terms in software development today. The most basic, valid definition for MVC in the context of this post, though, is to say that it is about creating patterns for application development that deliberately seek to segregate control and rendering logic which are optimized for the particular platform (in this case, JavaScript in the browser).

With this in mind, the [Eleutian](http://www.eleutian.com) team (notably Daniel Tabuenca) produced a kick-ass library that I always felt really attacked the problem of building complex, client-side applications in JavaScript in an effective, sensical fashion. It could have to do with the fact that this framework was the first I ever used in this particular solution/problem space, but I&rsquo;ve reviewed/experimented with several other frameworks since and never really liked any of them. Some reasons for this:

*   Many of them ([JavaScript MVC](http://www.javascriptmvc.com) in particular) are _very_ heavy, requiring things like having Rhino installed to do command-line scaffolding (wtf?!)
*   Others are tightly coupled in the manner in which view/template rendering is handled. Modern JavaScript development in the browser is interesting because there are several different ways to &ldquo;get there&rdquo;, when it comes to how you programatically display content. Options include, but aren&rsquo;t limited to: Direct DOM manipulation via jQuery/other frameworks ( $(&lsquo;#container&rsquo;).append(&lsquo;<div></div>&rsquo;); ), JavaScript Templating (EJS, Pure, etc) and/or tools/plugins that take structured data and directly output markup (jQuery.datatables, jqplot, etc). Eleutian&rsquo;s framework was originally tightly coupled to EJS for template rendering, but this has since changed (as I will explain shortly).
*   Some frameworks get the abstraction wrong, in my opinion. The scope of what I, the developer, want when doing client-side work is pretty narrow: aggregate events around some subset of the DOM and have a uniform way of manipulating/regenerating the markup in that subset in response to said events. The premise of &ldquo;smart models&rdquo; in an isolated browser environment (wiring up AJAX calls to the server) is way too much abstraction for me and, in the laissez-faire world of JavaScript, strikes me as very open to &ldquo;entering a world of pain&rdquo; scenarios.

From my time with the [Eleutian](http://www.eleutian.com/) team, one of the things I missed the most was the MVC framework I had used when I worked there. And while I can by no means take credit for creating or expanding `machine.javascript`, I can definitely say that I was able to harass Aaron Jensen and Dan into releasing the libraries in question as OSS (although they claim they were going to do it anyways). Hence, the [github repo](http://github.com/machine/machine.javascript) and this blog post.

### What is machine-javascript?

At the heart of it, machine-javascript consists of two components, each an individual javascript file:

* `machine-includer.js` &mdash; Specifies a &ldquo;script loader&rdquo; that works in a &ldquo;nested&rdquo; fashion (as opposed to &ldquo;flat&rdquo; includers like [LABjs](http://www.labjs.com)). It allows you to specify your dependencies in a manner similar to how you would in server-side code and then load it all (in a cascading fashion) during the page load. Like other script loaders, it is often not practical for performance-critical/production uses, but is great for dev/debug work and provides a critical advantage: The nested, per-file `include()` statements provide get hints for a recursive script parser to build a list of dependencies which you could use to create a single, bundled for your markup. The include() function that it creates can handle both external script loads (when passed a string) or evaluate functions passed to it. Regardless of which, both are evaluated in order of specification based upon the dependency tree created when looking at how invokations of include() are specified in files and the same external script is only loaded once.
*   `machine-controller.js` &mdash; Contains a prototype for the `Machine.Controller` object, which can be inherited in your &ldquo;controllers&rdquo; and provides a straightforward framework for specifying events and rendering logic on a piece of the DOM that the controller will be associated with.

Leveraging these two components, I will demonstrate how to create a simple controller with machine-javascript.

### A Simple Example

Let&rsquo;s consider the simplest possible _hello world_ case, utilizing machine-javascript.

    <head>
          <title>Hello, world!</title>
          <script type="text/javascript" src="machine-includer.js"></script>
        </head>

In our page&rsquo;s <head> tag section, we have a single script include. All we are going to load in this page in an explicit, static fashion is the `machine-includer.js` script.

Somewhere down in the <body>, we have a chunk of markup that looks something like:

          // this is the initial setup for machine.includer
          Machine.Includer.configure({scriptLocations : {'.*':''}});

          // include our external dependencies
          include('jquery.js');
          include('HelloWorldController.js');

          // and kick it all off once the page loads
          include(function() {
            $(function() {
              var hw = new HelloWorldController();
              hw.render();
              $('#container').append(hw.domRoot);
            });
          });

          include.load();

      </script>
        <div id="container"></div>

So this is interesting; We do some inital configuration for `machine-includer.js`, then load our external scripts that the page is dependant upon and then instantiate an object (defined in an external dependency) and attach one of its properties to the DOM via jquery&rsquo;s `append()` function.

Let&rsquo;s take each signifigant chunk on its own&hellip;

      // this is the initial setup for machine.includer
      Machine.Includer.configure({scriptLocations : {'.*':''}});`</pre>

This is the only initialization call needed to set up `machine.includer.js`; after this, you can safely call `include()`. The hash that is passed into `configure()` has one notable parameter: `scriptLocations`. It is a series of pairs that say to the includer, &ldquo;Hey, if you encounter the regex pattern in the left component in an includer URL, please prepend it with the contents of the right component.&rdquo; This means that, if you had some hinting from the server based on environment (dev, production, etc), you could configure `machine-includer.js` to mangle the script loads done via `include()` so they actually called out to an external CDN or local folder, depending on the runtime environment.

For example, consider if your static content was delivered by a CDN like Cloudfront in your production setting, but was served from a local Scripts directory in the same web server when run in the dev/test environments.

In an ASP.NET MVC WebForms template with a strongly-typed view that had an Environment property hooked up to some mythical enum or the like (this applies just as easily to other server frameworks) the server-side template might look like:

          // this is the initial setup for machine.includer
          <% 
            var prefix = Model.Env == Env.Production ? 'http://s3.yourdomain.com/path/'
              : '/Scripts/';
          %>
          Machine.Includer.configure({scriptLocations : {'^static.*': '<%= prefix %>'}});

In this way, you can drive how your scripts are loaded at runtime with a simple, per-page check to the ambient environment.

          // include our external dependencies
          include('jquery.js');
          include('HelloWorldController.js');`</pre>

In this chunk of code, we are declaring our dependencies for this page, utilizing calls to the `include()` function with strings for the paths to the files in question. As with <script> tags, you can pass in absolute or relative paths. But, as noted above with the `scriptLocations` configuration, you can also establish conventions (driven by server-side configuration) for mangling the path passed to `include()` to account for special cases.

          // and kick it all off once the page loads
          include(function() {
            $(function() {
              include.load(); // actually loads the scripts

              var hw = new HelloWorldController();
              hw.render();
              $('#container').append(hw.domRoot);
            });
          });

In this block we actually have some running javascript code, passed within a function to an invokation of `include()`. One thing worth pointing out, here, is that (when taken into context with the previous block where we used `include()` to load external scripts) calls to `include()` are never nested within the scope of a single file, they always appear serially. Now, when passing a string URL to `include()`, there will of course be calls to `include()` in the file indicated by the URL, but there are never calls to `include()` within the scope of a function passed to an existing call. Please remember this when writing your code or it&rsquo;ll fail and you&rsquo;ll be left scratching your head (speaking from experience, here).

Back to the function itself, you can see that it consists of a callback for jQuery&rsquo;s &ldquo;onReady&rdquo; event binding using the `$(function() { });` convention. When the document is ready (the DOM is completely loaded, mainly), we create an instance of a `HelloWorldController`, which we can assume was imported in a previous call to `include()` (the code for `HelloWorldController` will be shown shortly). There is some setup that happens in the course of `HelloWorldController`&rsquo;s initialization, which allows us to then invoke its `render()` function. This is a function defined in the `Machine.Controller` prototype that leverages some configuration done during initialization and renders the controller&rsquo;s desired markup in its `domRoot` property. Subsequent calls to `render()` will update the markup stored there.

Finally we, using jQuery&rsquo;s `append()` function and attach our controller&rsquo;s newly available `domRoot` to an element with an id of `container` (shown in the complete example above).

One of the fringe benefits of `Machine.Controller` is that subsequent calls to `render()` (outside of or within `HelloWorldController`) will automatically update the domRoot _and_ be reflected in the DOM without having call to `append()` on your container element again. This also applies to events bound from within `HelloWorldController` using `Machine.Controller`&rsquo;s syntax for doing so.

Going back to the complete example above, let&rsquo;s examine, once again, the external scripts loaded as dependencies for the page.

          // include our external dependencies
          include('jquery.js');
          include('HelloWorldController.js');`</pre>

You can guess pretty easily what&rsquo;s within `jquery.js`, and since it was needed in order to append our instance of `HelloWorldController` to the container <div> we loaded it up via `include()`.

But what about `HelloWorldController.js`? This contains the definition for our controller, the contents of which will be shown in [Part 2](/javascript/mvc/2010/02/18/An-Introduction-To-Machine-Controller-Part-2.html) of this series.

Finally, we have:

      include.load();


This actually triggers the script load and should come after all of the previous calls to `include()`.

### Conclusion

In this post, we covered the following topics:

*   A brief overview of my anecdotal introduction to MVC in JavaScript and my personal opinions and nags about it.
*   A rough description of the two pieces that make up `machine-javascript`: `machine-includer.js` and `machine-controller.js`.
*   A &ldquo;hello world&rdquo; example was shown of the HTML markup for an example page that uses the includer and controller. The contents of the actual controller script have not yet been shown (and are saved for part 2 in this series).
*   Some exposure to the semantics of using `machine-includer.js`.
*   Shows how a finished controller is instantiated and attached to the DOM.

I hope this post has been enlightening for you, the reader. Parts 1 and 2 really belong together (as each is uselss without the other), but if combined it&rsquo;d be a classic [tl;dr](http://www.urbandictionary.com/define.php?term=tl%3Bdr) article. I thought that was a good place to split them up. In any case, please continue on to [Part 2](/javascript/mvc/2010/02/18/An-Introduction-To-Machine-Controller-Part-2.html) for the rest of the story!
