---
layout: post
title: "Thinking about a \"Step 2\" for Context/Specification-style testing"
date: 2009-10-11 11:13:42 -0800
comments: true
categories: 
---

  

This is a post about the evolution of my thinking and practice regarding Context/Specification-style test composition. I&rsquo;d like to review my understanding and approach to it over time and some of the frictions that I encountered after the initial re-alignment of thinking that occurs when changing gears to this style of TDD, as opposed to more orthodox varieties. There may be nothing new here for some practitioners of TDD (if that&rsquo;s you: sorry for wasting your time); but for others who have made/are making the same mistakes as I or have some kind of &ldquo;itch&rdquo; in the back of their mind about how their tests just don&rsquo;t quite &ldquo;work&rdquo; with how they&rsquo;re currently writing them, perhaps this will help.

I by no means claim to be an expert of any sort on BDD or test-first development in general. That being said, I consider myself a pretty active practitioner of these techniques (I fall into the &ldquo;[Context/Specification](http://www.code-magazine.com/Article.aspx?quickid=0805061) aka &#8220;Bellware-Driven-Development&rdquo; camp).

Some time back, I received an email, asking me a question about some missing code in a pastebin I linked to in a mailing list discussion ([here](http://www.mail-archive.com/altnetseattle@googlegroups.com/msg00486.html), if you&rsquo;re interested). Sadly, the code is lost to the ages, but going back and reading that thread got me thinking about what the discussion was about and what I had learned since then.

The thread itself was about the value of [DRY](http://en.wikipedia.org/wiki/Don%27t_repeat_yourself) when composing tests in a Context/Specification style, specifically how adhering to DRY might lead one to create deep, nested class hierarchies of Contexts which serve the purpose of making test composition more convenient for the programmer, but having the consequence of obfuscating the intention of said Contexts and Specifications. Ayende has written a bit on this topic recently [here](http://ayende.com/Blog/archive/2009/09/29/scenario-driven-tests.aspx). Specifically:

> One of the main problem[s] with unit testing is that we are torn between competing forces. One is the usual drive for abstraction and eradication of duplication, the second is clarity of the test itself.

### An example domain

Before we look at some code to illustrate this, let&rsquo;s talk a bit about the domain used for this exercise. For now, we&rsquo;ll rely on a very generic, very shallow Bank application. Briefly, it consists of:

*   A `Customer`, who has a collection of `Accounts`.
*   The `Accounts` are broken down into two types:
*   `CheckingAccounts`
*   `SavingsAccounts`

Additionally, here are some business rules:

*   When a new `Customer` is created, they must have at least one `Account`.
*   Don&rsquo;t allow debits from `Accounts` that send the balance into negative territory.

Granted, in the real world, business rules aren&rsquo;t this black and white. But they&rsquo;ll do.

Based on this, we have enough to get started with some specifications. For the purposes of this post, I&rsquo;ll be using C# tests written with [MSpec](http://github.com/machine/machine.specifications). If you&rsquo;re not familiar with MSpec, I can&rsquo;t help you.

### Reasons to use inheritance when composing tests

Broadly speaking, there are two reasons to use parent/child relationships when composing tests:

1.  You have &ldquo;administrative&rdquo; concerns, such as configuring dependencies for some service under test (maybe setting up a DB session for an Integration test or generating mocks/stubs for something tested in isolation).
2.  You want to aggregate context, such as &ldquo;any context that inherits from this class is testing an entity/sccenario that is configured/modeled in some specific fashion&rdquo;.

At the end of the day, though, both of these concerns are about code reuse and not having to repeat yourself with cut&#8217;n&#8217;pastes of mundane, boiler plate code.

Some code to illustrate the first item:

    public class CustomerRepositoryThatIsStubbed
        {
          Establish context = () =&gt;
            customerRepository = Mocks.GenerateStub&lt;ICustomerRepository&gt;();

          protected static ICustomerRepository customerRepository;
        }

In the above example, the class would serve up a stubbed out `ICustomerRepository` that we could use for other services that may depend on it. This class could be used in any number of &lsquo;child&rsquo; Contexts that actually provide Specifications in order to get some predefined functionality.

You can more generally use these kinds of classes to aggregate a group of Specs, perhaps by domain concern (e.g. `CustomerWithdrawalSpecs`, `CustomerRepositoryQueryingSpecs`, etc).

Which leads into the second point noted above:

      public class new_customer_with_a_checking_account_with_a_hundred_dollar_balance
        {
          Establish context = () =&gt;
          {
            var account = new CheckingAccount(100.0m);
            customerWithHundredDollarsInCheckingAccount = Customer.NewWithAccounts(new [] {account});
          };

          protected static Customer customerWithHundredDollarsInCheckingAccount;
        }

        public class when_making_a_withdrawl_from_an_account_that_does_not_exceed_the_accounts_balance :
          new_customer_with_a_checking_account_with_a_hundred_dollar_balance
        {
          Establish context = () =&gt;
            debitThatDoesNotExceedCustomersBalance = new Debit(-60.0m);

          Because of = () =&gt;
            customerWithHundredDollarsInCheckingAccount
              .Accounts.Where(x=&gt;x.IsChecking).Single() // this could go away
              .ProcessTransaction(debitThatDoesNotExceedCustomersBalance);

          It should_withdraw_the_amount_from_the_customers_account = () =&gt;
            customerWithHundredDollarsInCheckingAccount
              .Accounts.Where(x=&gt;x.IsChecking).Single()
              .Balance.ShouldEqual(40.0m);

          static Debit debitThatDoesNotExceedCustomersBalance;
        }

        public class when_making_a_withdrawl_from_an_account_that_does_not_exceed_the_accounts_balance :
          new_customer_with_a_checking_account_with_a_hundred_dollar_balance
        {
          Establish context = () =&gt;
            debitThatDoesNotExceedCustomersBalance = new Debit(-60.0m);

          Because of = () =&gt;
            exception = Catch.Exception(() =&gt;
              customerWithHundredDollarsInCheckingAccount
                .Accounts.Where(x=&gt;x.IsChecking).Single() // this could go away
                .ProcessTransaction(debitThatExceedsCustomersBalance);

          It should_cause_an_error = () =&gt;
            exception.ShouldNotBeNull();

          It should_not_withdraw_the_amount_from_the_customers_account = () =&gt;
            customerWithHundredDollarsInCheckingAccount
              .Accounts.Where(x=&gt;x.IsChecking).Single()
              .Balance.ShouldEqual(100.0m);

          static Debit debitThatExceedsCustomersBalance;
          static Exception exception
        }

These three classes all deal with building out actual Context for use in defining our Specifications. The first class sets up a general Use Case or &lsquo;shape&rsquo; for the behavior we want to verify and the latter classes make use of it for their own ends. That being said, there is some friction.

### Keep the good and lose the bad

At first glance, there doesn&rsquo;t seem to be too much wrong with that approach, from an intention-revealing perspective (which ought to be foremost in your mind when writing these tests). The base class for the latter tests is right there, if you want to see what it does and its name gives a pretty good indicator of what it does, already.

Soon or later, though, you may run up against a wall where this approach doesn&rsquo;t scale. What if you deeply nest your Contexts?

      public class new_customer_with_a_checking_account_with_a_hundred_dollar_balance
        {
          Establish context = () =&gt;
          {
            var account = new CheckingAccount(100.0m);
            customerWithHundredDollarsInCheckingAccount = Customer.NewWithAccounts(new [] {account});
          };

          protected static Customer customerWithHundredDollarsInCheckingAccount = Customer.NewWithAccounts(new [] {account});
          };

          protected static Customer customerWithHundredDollarsInCheckingAccount;
        }

        public class and_another_customer_with_a_zero_dollar_balance :
          new_customer_with_a_checking_account_with_a_hundred_dollar_balance
        {
          Establish context = () =&gt;
          {
            var account = new CheckingAccount(0.0m);
            customerWithZeroBalance = Customer.NewWithAccounts(new [] {account});
          };

          protected static Customer customerWithZeroBalance;
        }

        public class when_transfering_funds_between_two_accounts :
          and_another_customer_with_a_zero_dollar_balance
        {
          Because of = () =&gt;
            customerWithZeroBalance.TransferFundsFrom(
              customerWithHundredDollarsInCheckingAccount.Accounts.Where(x=&gt;x.IsChecking).Single()
              , 60.0m);

          It should_add_the_funds_to_the_destination_account = () =&gt;
            customerWithZeroBalance.Accounts.Where(x=&gt;x.IsChecking).Single().Balance.ShouldEqual(60.0m);

          It should_remove_the_funds_from_the_source_account = () =&gt;
            customerWithHundredDollarsInCheckingAccount.Accounts.Where(x=&gt;x.IsChecking).Single()
              .Balance.ShouldEqual(40.0m);
        }

In this case, the third class (the one that actually has Specifications) only shows its relationship to its immediate parent. If these classes were split up, for whatever reason, amongst different source code files then it would become problematic to be able to easilly demonstrate what the intention was. For me, this approach was appealing because it seemed clever, at the time. But, after going down the path a ways, it didn&rsquo;t work out.

Additionally, having several base classes that set up specific edge cases for how scenarios are represented, data-wise, is kind of putting the cart before the horse. In Context/Specification testing, you want the Contexts themselves to be just as important, if not moreso, than the Specs. It should plainly and clearly spell out &ldquo;Because stuff is configured in such a fashion and we did something just so..&rdquo;, we get a result that we expect in our Specifications.

      public class when_transfering_funds_between_two_accounts
        {

          Establish context = () =&gt;
          {
            var zeroBalanceAccount = new CheckingAccount(0.0m);
            customerWithZeroBalance = Customer.NewWithAccount(zeroBalanceAccount);
            var hundredDollarsAccount = new CheckingAccount(100.0m);
            customerWithHundredDollarsInCheckingAccount = Customer.NewWithAccount(hundredDollarsAccount);
          };

          Because of = () =&gt;
            customerWithZeroBalance.TransferFundsFrom(
              customerWithHundredDollarsInCheckingAccount.Accounts.Where(x=&gt;x.IsChecking).Single()
              , 60.0m);

          It should_add_the_funds_to_the_destination_account = () =&gt;
            customerWithZeroBalance.Accounts.Where(x=&gt;x.IsChecking).Single().Balance.ShouldEqual(60.0m);

          It should_remove_the_funds_from_the_source_account = () =&gt;
            customerWithHundredDollarsInCheckingAccount.Accounts.Where(x=&gt;x.IsChecking).Single()
              .Balance.ShouldEqual(40.0m);
        }

Here, we&rsquo;ve just taken the stuff that went in the superclass Contexts and put them into the class that has the Specifications, which pretty much puts you back at square one. The reason things like using inheritance to contain Context is appealing is because, in the above example, the test composer has to repetitively do things like create objects for the System/Behavior Under Test, wasting precious keystrokes.

So how to do we mitigate this annoyance, thus acheiving the following:

1.  Foremost, the Contexts reveal the intention and provide meaningful information on what behavior, exactly, is being verified.
2.  Reduce repetition as much as possible while still satisfying the previous point.

Sharing information about lessons learned at this &ldquo;stage&rdquo; of competency for Context/Specification testing is where the community is, right now. Aaron Jensen blogged recently on the topic [here](http://codebetter.com/blogs/aaron.jensen/archive/2009/10/05/a-recent-conversation-about-mspec-practices.aspx) (disclosure: he used to be my boss). Much of the post is the body of an email that he wrote replying to someone&rsquo;s question about Context/Specification testing issues. Speaking about base classes that aggregate context, he said:

> &ldquo;&hellip;I don&rsquo;t like it now. I much more prefer to just have a base class that contains any utility/meaningless cruft my specs have. You also seem to have taken this to a bit of an extreme. Would you make a regular base class just to create a single instance variable and set it to null in the constructor? Probably not. Same stuff applies here. There&rsquo;s no value in creating base classes unless they provide value. There&rsquo;s no naming or understanding benefit. As a matter of fact, they _hinder_ understanding more than anything.&rdquo;

The bit about pushing utility methods into base classes is a pretty valid approach to reducing keystrokes in tests while retaining an intention-revealing value to them.

Consider the above example where we do all the setup in a single Context, but with the &ldquo;uglyness&rdquo; of the repatition. What if it were reworked to look more like:

      public class CustomerAccountTransferSpecs
        {
          public static Customer CustomerWithStartingBalanceOf(decimal startingBalance)
          {
            var account = new CheckingAccount(startingBalance);
            return Customer.NewWithAccount(account);
          }
        }

        public class when_transfering_funds_between_two_accounts : CustomerAccountTransferSpecs
        {
          Establish context = () =&gt;
          {
            customerWithZeroBalance = CustomerWithStartingBalanceOf(0.0m);
            customerWithHundredDollarsInCheckingAccount = CustomerWithStartingBalanceOf(100.0m);
          };
          ....
        }

Aside from some (possible) nitpicks regarding what kind of account a customer gets when using the helper method, this approach provides a net benefit in terms of revealing intent and keystroke reduction. From here, the direction to push is towards stream-lining this process. Once again, Aaron Jensen has done some blogging on the [topic](http://blog.eleutian.com/2007/09/29/FluentFixtures.aspx). Also, Greg Young [chimes in](http://codebetter.com/blogs/gregyoung/archive/2008/04/15/dddd-5-messages-have-fluent-builders.aspx) with a similar approach for an albeit different set of circumstances.

### Conclusion

A few things to remember:

1.  Using inheritance to DRY your way out of having to re-specify context is the wrong approach. &ldquo;Context explosion&rdquo; is something that you have to learn to deal with, but this approach will only serve to obfuscate your context, longterm. If you want to trim your keystrokes, instead consider the following:
2.  Having to re-specify context over and over _is_ a code smell. So think about the best, most intention-revealing way to present that context-building _for you_ and push it into some helper methods/fluent fixtures/etc instead of using rigid class hierarchies to represent that information.

Good luck and happy testing