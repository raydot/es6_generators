/**
 * Coding async with ES6 Generators
 */

 /**
  * The main strength of generators is they provide a single-threaded
  * synchronous-looking code style while allowing the asychronicity
  * to be hidden away as an implementation detail.
  * 
  * This allows for a natural expression of the code's flow without
  * having to simultaneously having to navigate asynchronous syntax
  * and gotchas.
  * 
  * Generators create a nice separation of capibilities and concerns 
  * by splitting up the consumption of values (gen logic) from the
  * implementation detail of asynchronously fulfilling those values
  * via next().
  */

  // Old way, sans generators:
  function makeAjaxCall(url, cb) {
      // do ajax, call callback when done
  }

  makeAjaxCall("http://whatever", function(result1)) {
      var data = JSON.parse(result1)

      makeAjaxCall("http://whateverelse" + data.id, function(result2) {
          var response = JSON.parse( result2 )
          console.log("The data you asked for: " + response.value)
      })
  }

  // GNARLY!  Let's use a generator

  function request(url) {
      // This is where to hide the asynchronicity, away from
      // the main code of our generator's `it.next()` which is
      // the iterator-resume call
      makeAjaxCall( url, function(response) {
        it.next(response)
      })
      // Nothing returned here.
  }

  function *main() {
      let result1 = yield request("http://whatever")
      let data = JSON.parse(result1)

      let result2 = yield request("http://whateverelse" + data.id)
      let response = JSON.parse(result2)
      console.log("The data you asked for: " + response.value)
  }

  var it= main()
  it.next() // Kick it off.

  /**
   * How does it work?
   * The request() helper function wraps the normal makeAjaxCall() to make sure 
   * its callback invokes the iterator's next() method.  
   * 
   * The request call has no return value, meaning it generates "yield undefined."
   * This just pauses the generator until the it.next() call is made to resume, 
   * which is also the callback for when makeAjaxCall finishes.
   * 
   * result1 = yield request() is asking for the value, but the implementation can 
   * run off and do whatever.  That's because yield creates a pause, the resumption
   * from which is handed off to the makeAjaxCall.
   * 
   * Bye bye callback hell and promise chains!
   * 
   * So that's cool, but is that all we can do?  Nope!  What if we want an in-memory
   * cache of previous responses?  Or some other reason that the info can be 
   * retrieved without needing to go fetch it from a server?
   * 
   * That can be done with this kind of implementation:
   */

   var cache = {}

   function request(url) {
       if (cache[url]) {
           // "defer" cached response long enough for current
           // execution thread to complete
           setTimeout(function() {
               it.next(cache[url])
           }, 0) // Give things a moment to get into a paused state at the completion of request()
       } else {
           makeAjaxCall(url, function(response) {
               cache[url] = response
               it.next(response)
           })
       }
   }

   // Notice the main generator code is still:
   let result1 = yield request("http://whatever")
   let data = JSON.parse(result1)

   // Nothing had to change at all.  The code in *main() still just asks for a value
   // and pauses before moving on.  That pause could be short or long but the flow
   // control made possible by the generator doesn't care.

   // That's the real power: abstracting away asynchronicity as the implementation detail.

   // *** BETTER ASYNC ***

/**
 * So what's lacking in where we've been so far?
 * 1.   There's no clear path for error handling.
 * 2.   Who knows what that makeAjaxCall is going to do?  What if it's called multiple
 *      times, with success on some calls and errors on others?
 * 3.   Can we run other tasks?  Yield is a single pause point, so how can we have them
 *      firing off between all kinds of different generators?
 * 
 * The solution?  yielding out promises!  Then let them resume the generator once they're 
 * fulfilled.  
 * 
 * Look back at yield request() up there at line #36.  It doesn't have any return value.
 * Seems like a good opportunity to return a promise!
 */

function request(url) {
    // Note: it's returning a promise now.
    return new Promise(function(resolve, reject) {
        makeAjaxCall(url, resolve)
    })
}

// Since the promise is returned, it can be yielded out.  So now we need a utility
// that controls the generators iterator.  Once that can receive those yielded
// promises and wire them up to resume the generator via next().

// run (async) a generator to completion
// Note: there's no error handling here
function runGenerator(g) {
    let it = g(), ret

    // asynchronously iterate over generator
    (function iterate(val) {
        ret = it.next(val)

        if (!ret.done) {
            // is it a promise?
            if("then" in ret.value)
            // wait on the promise
            ret.value.then(iterate)
        } else {         // immediate value, just send right back in
            // avoid synchronous recursion
            setTimeout(function() {
                iterate(ret.value)
            }, 0)
        }

    })()
}

/** 
 * So now what happens is:
 * 1.   The generator is automatically initialized (creating its
 *      it iterator) and it will asynchronously run to completion
 *      when done:true
 * 2.   runGenerator() is looking for a promise to be yielded out
 *      via the return value from each it.next() call.  Once it's 
 *      received runGenerator() starts waiting for then(...)
 * 3.   If an immediate -- non-promise -- result is returned its
 *      simply sent back to the generator so it can keep going
 *      immediately.
 */

 // How to use:
 runGenerator (function *main() {
     let result1 = yield request("http://someurl")
        let data = JSON.parse(result1)

    let result2 = yield request ("http://someotherurl?id=" + data.id)
    var resp = JSON.parse(result2)
    console.log("The value you asked for:", resp, value)
 })

 // Isn't that the exact same code we used before?  Yep!  It's all
 // now detail that's "hidden" in the runGenerator implementation.
// Now that we're using generators+promises to manage async we solve 
// all of the IOC and trust issues we had in earlier versions.

/**
 * WHY IS THIS COOL?
 * 1.   We have built in error handling which is easy to wire up.  It's 
 * not hard to listen for errors from a promise and wire them to it.throw()
 * and then use try...catch to handle error.
 * 2.   Comes with all of the built in control/trustability that promises
 * offer.  No muss, no fuss.
 * 3.   Generators have lots of built-in abstractions that handle all of the
 * complexities of multiple asks, etc.
 * 
 * For Instance:
 * yield Promise.all([...])
 * This takes an array of promises for "parallel" tasks and yields out a 
 * single promise for the generator to complete (in whatever order) before 
 * proceeding.  What comes back from the yield expression when the promise 
 * finishes is an array of all of the sub-promise responses, in order of 
 * how they were requested.
 */ 

 // Error handling:
 // assume: `makeAjaxCall()` expects an "error-first style" callback 
 // assume: `runGenerator()` also handles error handling

 function request(url) {
     return new Promise(function(resolve, reject) {
         // pass an error-first style callback
         makeAjaxCall(url, function(err, text) {
             if (err) reject (err)
             else resolve(text)
         })
     })
 }

 runGenerator( function *main() {
     try {
         let result1 = yield request("http://thisURL")
     }
     catch (err) {
         console.log("Error:", err)
         return
     }
     let data = JSON.parse(result1)

     try {
         let result2 = yield request("http://thatURL?id=" + data.id)
     } catch (err) {
         console.log("Error:", +err)
         return
     }
     let resp = JSON.parse (result2)
     console.log( "The value you asked for:", resp.value)
 })

 /** 
  * If a promise rejection (or any other error) happens while the
  * URL fetching is happening, the promise rejection will be mapped
  * to a generator error (see iterator.throw in 02_deeper.js) which 
  * will be caught by the try...catch statement.
  */

  // More complex example or using promises + generator:
  function request(url) {
      return new Promise(function (resolve, reject) {
          makeAjaxCall(url, resolve)
      })
      // do some post processing on returned text
      .then(function (text) {
          // Did it return a redirect
          if(/^https?:\/\/.+/.test(text)) {
              // make another request to the new URL
              return request(text)
          } else { // otherwise...
            return text
          }
      })
  }


runGenerator (function *main() {
    let search_terms = yield Promise.all([
        request("http://url01")
        request("http://url02")
        request("http://url03")
    ])

    let search_results = yield request (
        "http://url04?search=" + search_terms.join("+")
    )

    let resp = JSON.parse(search_results)

    console.log("Search results:", resp.value)

})

/**
 * Promise.all([...]) constructs a promise that waits on three
 * sub-promises, and the yields that promise to runGenerator to
 * listen for generator resumption.  The sub-promises can receive
 * a response that looks like another URL to redirect to, and 
 * chain off another sub-request promise to the new location.
 * 
 * Any kind of capability/complexity that promises can handle with
 * asynchronicity benefits from the use of generators that yield 
 * out promises of promises of promises of...
 */

 // SHAMELESS PLUG FOR AUTHORS OWN LIBRARY
 // PREVIEW OF ASYNC AWAIT IN ES7.   😂
