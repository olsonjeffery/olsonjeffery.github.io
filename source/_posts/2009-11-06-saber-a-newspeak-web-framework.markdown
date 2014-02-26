---
layout: post
title: "Saber: A Newspeak web framework"
date: 2009-11-06 11:50:39 -0800
comments:
categories: newspeak web
---

I&rsquo;m very pleased to announce the creation of yet another web framework, although it is the first (that I know of) for the [Newspeak](http://newspeaklanguage.org) platform. It started out as an intellectual exercise to explore Newspeak and some of it&rsquo;s reflective capabilities and idiosyncracies (specifically the pervasive class nesting). It was a very interesting and enjoyable development experience, to be sure (although it wasn&rsquo;t without its own gotcha moments and difficulties). Prior to this project, I played with Newspeak a bit at the time of the first release in late February. Besides that, my only experience with this style of development is some recreational programming with Squeak (I worked through about two-thirds of the [laser-game](http://squeak.preeminent.org/tut2007/html/) tutorial). Newspeak is a very young, yet capable and robust platform and I am more than impressed with what I&rsquo;ve encountered so far, although a lot of its much-heralded functionality has yet to be implemented. All in good time, I suppose.

### Saber and web frameworks in a historical context

Saber is a web application framework that takes a somewhat different approach to web application development and modelling from other, more popular frameworks that you may have heard of. In a way, it may be a sort of counter-evolution in terms of conceptualization of how web frameworks have been structured since Rails came on the scene.

In the [Bad Old Days](http://en.wikipedia.org/wiki/Web_application#History), HTTP was used exclusively as a static content presentation protocol, where URL requests typically mapped to documents in a folder under the wwwroot of some site. When server-side technology solutions (ASP, Java Servlets, CGI, etc) became more common, it ended up being some script/code handling requests, which may or may not have been routed to a script corresponding to the URL somehow. But, with the rise of Rails and the slew of other HTTP-based &ldquo;MVC&rdquo; frameworks that have followed in its wake, we now have a popular paradigm of Controllers and Actions and the basic request-handling conventions that they bring to mind. When the need for more taxonomy beyond Controller/Action became perceived as necessary, we got things like Areas or custom routing schemes to match a request for some URL to a given action, perhaps with some parameter mapping to give the whole thing a more RESTful feel.

The pitfalls of the Controller/Action modelling pattern for web frameworks is something that isn&rsquo;t within the scope of the topic of this post, but it suffices to say that it has become enough of a nuisance after a while for any non-trivial example application that several people have come up with alternative approaches. Foremost of these in my mind is [Sinatra](http://www.sinatrarb.com), an excellent framework that models endpoints as &ldquo;routes&rdquo; (that is, some HTTP Method/URL pair that can be matched by a request) and a block of code to handle that request when the route is matched. I have experimented a bit with porting this approach to the ASP.NET world (the results of which can be found [here](http://github.com/olsonjeffery/mercury)). This approach is present in several frameworks as a &lsquo;first-class&rsquo; alternative to the Controller/Action structure so popular elsewhere (from the direct url->handler WSGI mapping in Google AppEngine&rsquo;s [webapp](http://code.google.com/appengine/docs/python/gettingstarted/usingwebapp.html) framework to [OpenRasta](http://trac.caffeine-it.com/openrasta)).

Saber subscribes to the above request/routing-centric viewpoint, but with a twist. From the Saber README:

> Essentially: Instead of artificially aggregating endpoints into a Controller/Action hierarchy, Saber lets the structure of the routing handlers becoming the organizing taxonomy for the application.

To further entertain this MVC straw-man, most stereotypical MVC web frameworks reveal the intent and function of their endpoint handlers by aggregating them as actions within controllers. In some static frameworks (in Java or .NET, mostly), the aggregation is also an administrative concern for convenience when using an Inversion-of-Control scheme, leading to kludgey groupings of functionality that don&rsquo;t scale well, in my experience.

So, how does Saber acheive this taxonomy? By using a fundamental feature of Newspeak: pervasive class nesting. In Newspeak, there is no global namespace. Practically, this means that every &ldquo;top-level&rdquo; class itself acts as a module. Within this top-level class, you can nest other classes. It seemed natural, to me, to use this approach to model a web site&rsquo;s request handlers, with a class called `foo` handling requests to `/foo`, and a class nested within that one called `bar` handling requests to `/foo/bar`, etc. Each of these &ldquo;Handler&rdquo; classes implements one or more methods that each correspond to an HTTP method (`onGet:` for GET, `onPost:` for POST, etc). These Handler methods are themselves the actual endpoints for a given request.

Saber also includes a &ldquo;toy&rdquo; view rendering system, [creatively] named SaberView.

### So what does this look like?

At the highest level, you have a &ldquo;site&rdquo; class that acts as a model/container for your site&rsquo;s definition. This site contains a few administrative things (like the name of the site for the httpd, the port, etc). Besides that, it must include a nested class called SiteRoot that inherits from SaberHandler (which is the basic route Handler class in Saber). That class itself will match on requests to the root of a site. From there, you can nest classes that match to &ldquo;nodes&rdquo; in a route request. For example:

    + SiteRoot
      - foo
      - baz
        - bar

This would be an example of a taxonomy of classes that would have handlers that could potentially match requests for `/`, `/foo`, `/baz` or `/baz/bar`. Once again, a handler will only be called if it implements a method corresponding to the HTTP method of a request. So if `/baz/bar` only implements `onPost:`, then a GET request to `/baz/bar` will return a 404.

### Specialized handlers

But vanilla route handling isn&rsquo;t all that Saber does. It handles a number of &ldquo;must have&rdquo; features for routing-centric web frameworks, including: a NotFound handler scheme, &lsquo;parameter&rsquo; handlers and static file serving.

#### Not found handlers

By default, Saber will return a generic 404 response if a request&rsquo;s url cannot be matched to a handler. Optionally, you can specify a special handler that inherits from `SaberNotFoundHandler` that will be processed when a request cannot be matched to an existing Handler. Otherwise, it works just like any other handler with the `onGet:`, `onPost:`, etc.

#### Parameter handlers

Saber allows specifying a Handler nested within another one, inheriting from `SaberParameterHandler` to be used as a special-case parameter matching handler. That is, given the following taxonomy:

    + SiteRoot
      - foo
      - baz
        - bar
        - nameParam

In this case, the `nameParam` class is a class that inherits from `SaberParameterHandler`. What this means is that, at request time, if the request url doesn&rsquo;t match to any of the other &lsquo;sibling&rsquo; handlers at the same level as the parameter handler, then the parameter handler itself will be matched. This way, it could be used as a catch-all and won&rsquo;t interfere with handlers at the same level. This means that requests for `/baz/bar` would match to the `bar` class, but requests for `/baz/john` or somesuch would match to the `nameParam` handler, since there is no other handler that would match the request, otherwise. Also, the value of the request (in the case of the previous example &lsquo;john&rsquo;) will be stored within the requests query fields with _the name of the handler_ as the key.

Naturally, this means that only a single `SaberParameterHandler`-inheriting class can be nested within a group of sibling handlers. Besides the above issues, the handler behaves exactly like a normal handler, including allowing other handlers to be nested within it.

#### Serving static content

And what web framework would be complete without a means with which to serve up CSS, JavaScript, etc? Saber allows for classes that inherit from `SaberStaticFileHandler` that are nested with the SiteRoot to be mapped to physical locations on the filesystem (exposed by overriding the `documentRoot` method on the class) and mapped to the class&#8217; name. So a class inheriting from `SaberStaticFileHandler` named `static` and pointing to a location on the filesystem would be matched. A request for `/static/style.css` would be matched to whatever path was specified in the `documentRoot` with `style.css` appended to the end.

### What&rsquo;s not-so-great about Saber, right now?

First and foremost: I&rsquo;m not terribly happy with the rather &ldquo;minimalistic&rdquo; view engine. It has two very useful features (value substition and block inheritance), but that&rsquo;s it. I, personally, am a very big fan of pushing as much work onto the client javascript as possible, using server-side views to deliver JSON and that&rsquo;s it, if possible. But there are always some situations where it makes sense to just do the rendering on the server (like some non-interactive reporting that won&rsquo;t feature any AJAX callbacks after the initial request). With this in mind, a slighlty more robust solution with conditionals, looping and more sophisticated value substitution (that allows passing in actual objects instead of just strings) would be nice, longterm.

Also, Saber is currently tightly coupled to the underlying platform for the Newspeak environment: Squeak. This isn&rsquo;t a bad thing necessarily, but eventually Newspeak will move beyond this and Saber currently uses HttpService, which is used in [Seaside](http://www.seaside.st/) (not to mention several collection primitives, HttpRequest/Response, etc). I&rsquo;m glad that the Squeak libraries are there, as they allowed me to cut some corners and concentrate on features instead of low-level plumbing, but these things will have to be replaced longterm. Whether or not Saber survives long enough to see that day is another question.

Another nagging issue is that Saber doesn&rsquo;t support multiple sites in the same instance using the HTTP 1.1 host header. This is supported in the underlying httpd from Squeak, but isn&rsquo;t something that I&rsquo;ve gotten around to implementing.

Overall, I tried to keep the scope of the project somewhat narrow (I&rsquo;ve only been working on it for a few weeks and I&rsquo;m quite pleased with the progress I&rsquo;ve made). I mostly wanted to get the project out &ldquo;into the wild&rdquo; in order to get some feedback on the viability of this approach. I wouldn&rsquo;t really recommend the nested class approach other platforms like Java or .NET, even though they support this feature. Alot of what makes nested classes appealing in Newspeak is that it&rsquo;s a first-class concern and is built into the IDE, so there&rsquo;s some tooling to reduce the friction. I wouldn&rsquo;t say that this same tooling/mindset exists for other platforms.

### How to see Saber in action

The README.md in the [Saber repository](http://github.com/olsonjeffery/saber) has some pointers on how to get started, should you be so inclined.

### Conclusion

I&rsquo;d like to give a big thanks to the motivating people behind this project: The Newspeak team, for conceiving of this awesome vision and delivering a working prototype for people like me to hack around with. I wish this project the best and hope to find a way to get involved with helping move things forward, longterm. Also, all of the people who aren&rsquo;t satisfied the state of things in terms of software abstractions and patterns in general. Whether you&rsquo;re a pathological tinkerer like me or a more pragmatically-minded person, it&rsquo;s the unreasonable nerd who isn&rsquo;t satisfied with the reigning paradigm that actually moves the ball forward.

Please note that I don&rsquo;t actually consider Saber to be a part of the canon of earth-shattering software innovations or theory; I just like to speak in broad, sweeping terms.
