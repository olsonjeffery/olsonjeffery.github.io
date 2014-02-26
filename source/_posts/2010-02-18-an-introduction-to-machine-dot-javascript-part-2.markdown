---
layout: post
title: "An Introduction to machine.javascript part 2"
date: 2010-02-18 12:28:51 -0800
comments:
categories: javascript web
---

This post is a continuation from [Part 1](/javascript/mvc/2010/02/17/An-Introduction-To-Machine-Controller.html), which introduced the ideas of `machine-javascript`, namely the script loader and a simple example, showing how a `HelloWorldController` was instantiated and attached to the page. What was not explored, however, was what the `HelloWorldController` actually looks like and how it works. That is the topic of this post.

### Let's Dive Right In!

Here is the content of `HelloWorldController.js`, loaded into our page in the example shown in [Part 1](/javascript/mvc/2010/02/17/An-Introduction-To-Machine-Controller.html) of the series:

        include('jquery.js');
        include('machine-controller.js');
        include(function() {
          var global = this;

          var viewLeft = '<div><a id="clicker" href="#">Hello world!</a> I have been clicked ';
          var viewRight= ' times.</div>';

          global.HelloWorldController = function() {
            this.init(); // kicks off Machine.Controller's internal setup
                         // .. always call this first.
            this.clickCount = 0;
            this.setView(viewLeft + this.clickCount + viewRight);
            this.addAction('click', '#clicker', this.onClickerDivClick);
          };

          global.HelloWorldController.prototype = new Machine.Controller();
          var hw = global.HelloWorldController.prototype;

          hw.onClickerDivClick = function(e) {
            // 'this' is always bound to the controller object
            this.clickCount += 1;
            this.setView(viewLeft + this.clickCount + viewRight);
            this.render(); // refresh the domRoot property
          };
        });

Okay! A lot to take in there. Let&rsquo;s start with the `include()`s at the top of the file.

        include('machine-controller.js');
        include(function() {
          ...
        });

As noted in [Part 1](/javascript/mvc/2010/02/17/An-Introduction-To-Machine-Controller.html), calls to `include()` are never nested within the scope of a single file, but always occur serially. The first call is to load up `machine-controller.js`, upon which this file is dependant. If `HelloWorldController` were dependant upon a &ldquo;ViewRenderer&rdquo; (which is discussed further down), it would also be included at this point. Finally, the actual body of the script is contained within an `include()`. This is a convention that must be adherred to in order to leverage the utility of `machine-includer.js`. Strictly speaking, `machine-controller.js` takes no dependency upon `machine-includer.js` and you could easily use it with another script loader or no loader at all, but for the purposes of this example we are going to use it.

          var global = this;

          var viewLeft = '<div><a id="clicker" href="#">Hello world!</a> I have been clicked ';
          var viewRight= ' times.</div>';

At this point, we&rsquo;re just setting up some variables that will be used in the course of defining `HelloWorldController`. I, by habit, typically assign the top-level `this` in a given script to `global`. The next two variables, `viewLeft` and `viewRight` are two chunks of text that will make up the &ldquo;view&rdquo; rendered by `HelloWorldController` (that is, the markup that it attaches to the DOM). This approach is not-at-all optimal for general use, but is merely meant to demonstrate the basic functionality of `setView()`, which will be covered in-depth below.

          global.HelloWorldController = function() {
            this.init(); // kicks off Machine.Controller's internal setup
                         // .. always call this first.
            this.clickCount = 0;
            this.setView(viewLeft + this.clickCount + viewRight);
            this.addAction('click', '#clicker', this.onClickerDivClick);
          };

This chunk of JavaScript is the declaration of `HelloWorldController`&rsquo;s constructor/intializer and is where the majority of `Machine.Controller`-derived controller objects are configured. There&rsquo;s a lot of important stuff here, so let&rsquo;s go line by line.

          this.init(); // kicks off Machine.Controller's internal setup
                       // .. always call this first.

The `init()` function in a `Machine.Controller`-derived object is where internal initialization is housed. It should be the first thing you call in any controller you define. Obviously, overloading/replacing this would be a Bad Thing unless you really know what you&rsquo;re doing. Thankfully, at least, much like Controller development on the server, you&rsquo;re not terribly likely to have deeply nested inheritance hierarchies of Controller classes. But if you do need to do so, you can always take measures to Make It Work.

      this.clickCount = 0;

`this.clickCount` is a stateful counter that we&rsquo;re going to use to track clicks to the DOM that this controller &ldquo;owns&rdquo;. This is an example of how client-side controllers are stateful (one thing that can be thought of differently from server-side controllers in many instances).

Another thing to note: it can generally be assumed that any call to `this` in the top-level scope of a function attached to the prototype for a `Machine.Controller`-derived object will reference the object itself. This is normal behavior typically but, interestingly, this also applies to functions bound to events using the `addAction()` function, which is shown below. Typically, at least with jQuery event binding, `this` is bound to some kind of context information for the event in question. Of course, callbacks passed into jQuery functions like `$.each()` and `$.get()` will still have their `this` variable re-bound, as is expected.

      this.setView(viewLeft + this.clickCount + viewRight);

This is the `setView()` function, mentioned above. It is used to tell a controller what mechanism it will use to get some markup that will represent its presence in the DOM. There are two valid signatures for this function:

          this.setView(aString);
          this.setView(aString, anotherString);

The first signature just takes a single string and is the format used in `HelloWorldController`. This treats the passed-in string as static markup text and will move to immediately convert it to a DOM and then attach it to the page&rsquo;s DOM when needed. This is the simplest possible use case for `setView()` and isn&rsquo;t often practical, but can be useful.

The second signature takes two strings: The first is an argument to pass in to a ViewRenderer. The second argument is the &ldquo;key&rdquo; for that ViewRenderer. In this case, the &ldquo;key&rdquo; refers to a string that the renderer uses to globally identify itself when it is registered with `Machine.Controllers` mechanism for tracking ViewRenderers. The details of how this works won&rsquo;t be covered in this post, but just know that it is there.

If you&rsquo;d like to see an example of this use of `setView()` and ViewRenderers right now, then look at the `/example/example.html` file in the [machine-javascript](http://github.com/machine/machine.javascript) github repo and check out the &lsquo;ViewRenderers and Views&rsquo; example.

Back to the larger issue of the signifigance of `setView()`, after calling `setView()` you should know that any calls to the controller&rsquo;s `render()` function will cause whatever &ldquo;instructions&rdquo; were passed in to `setView()` to be reevaluated and the results placed in the `domRoot` property of the object. You can also arbitrarily call `setView()` at your pleasure to change the &ldquo;rendering strategy&rdquo; for a given controller (but will of course want to call `render()` after that so the changes can be reflected in the `domRoot`).

The last line in our controller&rsquo;s initializer function is:

      this.addAction('click', '#clicker', this.onClickerDivClick);

This is the previously mentioned `addAction()` function. It is a wrapper around jQuery&rsquo;s event binding mechanism that provides a few advantages:

*   Events bound in this fashion don&rsquo;t need to be manually rebound when the controller&rsquo;s DOM changes (this uses a combination of jQuery Live Events and manual re-binding on DOM change).
*   As mentioned above, callbacks passed in to `addAction()` keep their `this` property bound to the controller object, instead of the context for the event that called it.
*   It provides a straightforward interface to pool your event bindings in a single location.

The syntax is straightforward: The first argument is the name of the event that should be listened for. This uses the jQuery convention for event names (`onClick` becomes `click`, `onBlur` becomes `blur`, etc). The second argument is the CSS selector for the element(s) you want a callback bound to. And the third argument is the function callback you want to pass in. For the sake of keeping things clean, I specify my event handlers on the prototype of the controller itself and pass those in. There&rsquo;s nothing that says you can&rsquo;t specify the function inline, if you so desire. Do note, though, that `this` will be bound to the enclosing controller regardless.

One last interesting (and important) detail: event callbacks bound using `addAction()` will only be triggered when the event occurs on elements _in the subset of the DOM owned by the controller_.

So if, for example, you have several controllers in a given page that each expose elements that all have the `foo` class, then a call to `addAction('click', 'a.foo', this.someCallback);` will only trigger the `this.someCallback` function for clicks on those links in the view generated by the controller. Nifty, eh?

Looking at the next chunk of JavaScript in our `HelloWorldController` example, we have:

          global.HelloWorldController.prototype = new Machine.Controller();
          var hw = global.HelloWorldController.prototype;

Here, we see that `Machine.Controller` uses the usual prototypical inheritance found in JavaScript. It was originally based on John Resig&rsquo;s &ldquo;Simple JavaScript Inheritance&rdquo; model but was subsequently converted to use the more common prototype model. After that, you can see that we assign `HelloWorldController`&rsquo;s prototype to a simple, local variable called `hw` for convenience. This is to merely save keystrokes. It isn&rsquo;t such a big time-saver for simple controllers like this one but, if your controller had more functions attached to its prototype, this sort of thing becomes more valuable.

Secondarily, it&rsquo;s also useful to declare the &ldquo;public&rdquo; functions and properties for a Controller, while allowing you to create functions that aren&rsquo;t attached to it and keep those as &ldquo;private&rdquo;, if that&rsquo;s your thing.

And finally, we have:

          hw.onClickerDivClick = function(e) {
            // 'this' is always bound to the controller object
            this.clickCount += 1;
            this.setView(viewLeft + this.clickCount + viewRight);
            this.render(); // refresh the domRoot property
          };

This is the callback that was passed-in to `addAction()` in our constructor function. It is a typical event-handler callback, with the event information as the sole argument to the function. This may or may not be useful to you and you can omit it if you want to. As is indicated in the comment, `this` is bound to the enclosing controller. This means that we have access to any stateful information contained therein (`clickCount`, in this case).

The callback increments the `clickCount` property by one and then calls `setView()` with the same `viewLeft` and `viewRight` variables used in the constructor, but with the newly incremented `clickCount`. If we were using a more sophisticated rendering scheme, we would merely modify the controller&rsquo;s `model` property and let that &ldquo;trickle down&rdquo; to the ViewRenderer. In this case, the call to `setView()` would go away and the subsequent call to `render()` will be all that would be needed to update the DOM. But, since we&rsquo;re using the simplest possible approach to specifying a view in this example, we have to update the view&rsquo;s markup ourselves via `setView()`.

### Conclusion

In this post, we covered:

&ndash; The contents of the `HelloWorldController.js` file that is first mentioned in [Part 1](/javascript/mvc/2010/02/17/An-Introduction-To-Machine-Controller.html) of this series. A typical `Machine.Controller`-derived object contains:
&ndash; A constructor function, with the first statement in it being a call to `init()`. This does the internal setup for `Machine.Controller` and should always be called first. Also don&rsquo;t replace it in the prototype unless you know what you&rsquo;re doing.
&ndash; In additional to any per-controller setup, a constructor will usually contain:
&ndash; A call to `setView()` to designate the view rendering scheme for this controller. You can either pass in static text (which you need to update yourself via calls to `setView()`) or designate a pre-registered ViewRenderer to handle the details for you. The details of how ViewRenderers work is for another post.
&ndash; One-or-more calls to `addAction()` to bind event callbacks to elements in the subset of the DOM owned by the controller.
&ndash; Each call t `addAction()` is going to need a corresponding callback. `this` in the callback will correspond to the enclosing controller, giving you access to state information.
&ndash; Call `render()` when you want to update the markup in the `domRoot`.

Stayed tuned for Part 3, where I&rsquo;ll go over one of the most useful architectural features of `machine-controller.js`: ViewRenderers. Until then, take it easy!'
