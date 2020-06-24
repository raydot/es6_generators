/**
 * Generator is a new breed of function.
 * They work differently than functions in terms of how they run to completion.
 */

const { setupMaster } = require('cluster');

// Traditional function:
setTimeout(function () {
  console.log('hello world');
}, 1);

function foo() {
  // Never write a function like this
  for (let i = 0; i <= 1e10; i++) {
    console.log(i);
  }
}

// foo();

// The timer's anonymous function can't run until foo is complete,
// Because foo is hogging the event-loop.
// What can be done?

// (Web workers, yes, but that's another topic.)

/**
 * Enter generators!
 * They are a function that can be paused and resumed later, allowing
 * code to run during the paused periods.
 *
 * The yield keyword is used to pause.  Messaging is allowed into
 * and out of the generator as it progresses.
 */

// The syntax
function* generatorFunction() {
  // The '*' indicates that it's a function.
}

function* generatorFunction2() {
  let x = 1 + (yield generatorFunction2);
  console.log(x);
}

// generatorFunction2() will send the function value out when pausing the
// function.  When the generator is restarted whatever value is sent in will
// be the result of that yield, which will then get added to 1 and
// assigned to x.

// So send "generatorFunction2" out, pause, and at some point later the
// generator will be restarted and will give a value back.  Think of yield
// as asking for a request for a value.

// It doesn't have to pass a value out:
function someFunction() {
  console.log('x: ' + x);
}

function* bar() {
  yield; // just pause
  someFunction(yield); // pause waiting for data to be passed in to someFunction
}

// Generator as iterator:
function* genAsIterator() {
  yield 1; // or whatever
  yield 2;
  yield 3;
  yield 4;
  yield 5;
}

let iterator = genAsIterator();

// So now to start iterating on it:
let message = iterator.next();

// returns 1 from "yield 1"

console.log(message);

// returns { value: 1, done: false }

console.log(iterator.next()); // {value: 2, done: false}
console.log(iterator.next()); // {value: 3, done: false}
console.log(iterator.next()); // {value: 4, done: false}
console.log(iterator.next()); // {value: 5, done: false}

// Iterated all the way through the yields, but still not done!

console.log(iterator.next()); // {value: undefined, done: true}

// Can return be used from generator?
function* canUseReturn() {
  yield 1;
  return 2;
}

let curVar = canUseReturn();

console.log(curVar.next()); // { value: 1, done: false }
console.log(curVar.next()); // { value: 2, done: true } value comes from return

// BUT: Shouldn't rely on this because final return value might be skipped or
// thrown away.

// Send messages into and out of a generator:
console.log('***SUPER GENERATOR***');
function* superGenerator(x) {
  let y = 2 * (yield x + 1);
  let z = yield y / 3;
  return x + y + z;
}

let sgVar = superGenerator(5);

console.log(sgVar.next()); // { value: 6, done: false } 6 from yield x + 1
console.log(sgVar.next(12)); // { value: 8, done: false } 8 from yield y / 3
console.log(sgVar.next(13)); // { value: 42, done: true }  5 + 24 + 13 = 42

// *** FOR...OF ***
console.log('*** FOR...OF ***');

// ES6 provides direct support for running iterators to completion via
// for...of which runs until the function returns "done: true".  Once
// done is true, the loop iteration stops and that's it.

function* forOfLoop() {
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
  return 6;
}

let v;

for (v of forOfLoop()) {
  console.log(v); // 1 2 3 4 5
}

console.log(v); // v is still 5

// Questions still to be answered:
// 1.  How does error handling work?
// 2.  Can one generator call another?
// 3.  How does async work with generators?
