# jasmine-async
Asynchronous helpers compatible with both Jasmine 1.3 and 2+
Although this was originally intended for testing frameworks, it can also be used for application async management.  
Concept is similar to promises, but intended for an implicitly resolved top-down approach/

##Usage
Include async.js in your script runner after jasmine.js
No configuration is necessary.

##API
- `async(fn)` - calls fn with an async object - returns async object for chaining
- `async.then(fn)` - calls fn after async.complete has resolved - returns async object for chaining
- `async.complete(args..)` - resolves the async operation.  Async.then functions are called with args... 
- `async.only(fn)` - returns async.complete function (useful for inline asynchronous behaviors).  fn is called when the complete function is invoked.
- `async.all(fn)` - calls fn with an async all behavior.  Returns an async all behavior.  All does not resolve until all asynchronous children are resolved.
- `async.any(fn)` - calls fn with an async any behavior.  Returns an async any behavior.  Any resolves immediately when a child asynchronous behavior resolves.


##Jasmine 1.3 Examples
````
describe('asynchronous behaviors',function () {
  it('resolve with async.only',function () {
    setTimeout(async.only(function () {
      expect(1).toBe(1);
    }),100)
  });
});
````
more examples coming soon.

##Jasmine 2.0 Examples
````
describe('asynchronous behaviors',function () {
  it('resolve with async.only',function (done) {
    setTimeout(async.only(function () {
      expect(1).toBe(1);
    }).then(done),100);
  });
});
````
more examples coming soon

##Application Examples

##### async.only
````
setTimeout(async.only(function () {
  console.log(1);
}).then(function () {
  console.log(2);
}),1000);
````

##### async.complete
````
async(function (async) {
  setTimeout(function () {
    console.log(1);
    async.complete();
  },500);
}).then(function () {
  console.log(2);
});
````

##### async.all
````
async.all(function (all) {
  setTimeout(all.only(function () {console.log(1);}),10);
  setTimeout(all.only(function () {console.log(2);}),50);
  setTimeout(all.only(function () {console.log(3);}),100);
  setTimeout(all.only(function () {console.log(4);}),1000);
  all(function (async) {
    setTimeout(function () {
      console.log(5);
      async.complete();
    },2000);
  }).then(function () {
    console.log(6);
  });
}).then(function () {
  console.log(7);
});
````

##### async.any
````
async.any(function (any) {
  setTimeout(any.only(function () {console.log(1);}),10);
  setTimeout(any.only(function () {console.log(3);}),50);
  setTimeout(any.only(function () {console.log(4);}),100);
  setTimeout(any.only(function () {console.log(5);}),1000);
  any(function (async) {
    setTimeout(function () {
      console.log(6);
      async.complete();
    },2000)
  }).then(function () {
    console.log(7);
  });
}).then(function () {
  console.log(2);
});
````

##### behavior chaining
````
async.any(function (any) {
  any.all(function (all) {
    setTimeout(all.only(function () {console.log(1);}),1);
    setTimeout(all.only(function () {console.log(3);}),2);
    setTimeout(all.only(function () {console.log(4);}),3);
    setTimeout(all.only(function () {console.log(5);}),4);
  });
  any.all(function (all) {
    setTimeout(all.only(function () {console.log(7);}),100);
    setTimeout(all.only(function () {console.log(8);}),200);
    setTimeout(all.only(function () {console.log(9);}),300);
    setTimeout(all.only(function () {console.log(10);}),400);
  });
}).then(function () {
  console.log(6);
});
````

