/**
 * Diving Deeper with ES6 Generators
 */

// Error handling.

// The symantics of the code inside a generator are synchronous
// even if the external iteration control proceeds aynchronously.

// This means the old ways of error catching are still the best ways

function* errorHandling() {
  try {
    let x = yield 3;
    console.log('x: ' + x); // this might never happen!
  } catch (err) {
    console.log('Error: ' + err);
  }
}

// The function will pause at yield 3, as expected, and may stay
// there for however long.  But if an error gets sent back it
// will be caught!  Example:

let iterator = errorHandling();

var res = iterator.next(); // {value: 3, done: false}

// Instead of another next, let's throw in some sand
iterator.throw('Whoopsie!');

// Works like normal JS so if a generator throws an error but no try...catch
// cathces it, the error will propogate out and if not caught end up as an
// unhandled rejection.  So the proper way:
function* errorHandling2() {}

let iterator2 = errorHandling2();

try {
  iterator2.throw('Whoopsie!');
} catch (err) {
  console.log('Error: ' + err); // Error: Whoopsie!
}

// The reverse way works too:
// Not the greatest example because x as an integer doesn't have a
// .toUpperCase() function, but...
function* errorHandling3() {
  let x = yield 3;
  let y; // = x.toUpperCase(); // could be a typeerror
  yield y;
}

var iterator3 = errorHandling3();

iterator3.next(); // {value: 3, done: false}

try {
  iterator3.next(42); // no "toUpperCase()" with integers
} catch (err) {
  console.log(err); // indeed throws that typeerror!
}

// *** DELEGATING GENERATORS
// How to delegate iteration control of a generator to another
// generator using yield *

function* thisFunction() {
  yield 3;
  yield 4;
}

function* thatFunction() {
  yield 1;
  yield 2;
  yield* thisFunction(); // designates iteration control to thisFunction()
  yield 5;
}

let v;
for (v of thatFunction()) {
  console.log(v); // 1, 2, 3, 4, 5
}

// Can also do this without a for...of
function* firstFunction() {
  let z = yield 3;
  let w = yield 4;
  console.log('z: ' + z + ', w: ' + w);
}

function* secondFunction() {
  let x = yield 1;
  let y = yield 2;
  yield* firstFunction(); // instantiate and delegate!
  let v = yield 5;
  console.log('x: ' + x + ', y: ' + y + ', v: ' + v);
}

var iterator4 = secondFunction();

iterator4.next(); // { value: 1, done: false}
iterator4.next('X'); // { value: 2, done: false}
iterator4.next('Y'); // { value: 3, done: false}
iterator4.next('Z'); // { value: 4, done: false}
iterator4.next('W'); // { value: 5, done: false}
// z: Z, w: W (from firstFunction())

iterator4.next('v'); // { value: undefined, done: true}
// x: X, y: Y, v: v (from secondFunction())

// There's no reason this couldn't delegate to a delegate and so on ad infinitum

// yield* can also receive a returned value from the delegated generator:
function* catcher() {
  yield 2;
  yield 3;
  return 'im catcher';
}

function* pitcher() {
  yield 1;
  let v = yield* catcher();
  console.log('v:', v);
  yield 4;
}

var iterator5 = pitcher();

iterator5.next(); // { value:1, done: false}
iterator5.next(); // { value:2, done: false}
iterator5.next(); // { value:3, done: false}
iterator5.next(); // "im catcher" { value:4, done: false}
iterator5.next(); // { value:undefined, done: true}

/**
 * This illustrated the difference between yield and yield*.
 * yield = result is whatever is sent with next()
 * yield* = result comes from designated return value since next() passes values transparantly
 */

// ERROR HANDLING WITH yield*

function* receiver() {
  try {
    yield 2;
  } catch (err) {
    console.log('receiver caught:', err);
  }

  yield; // pause

  // Throw another error:
  throw 12345;
}

function* quarterback() {
  yield 1;
  try {
    yield* receiver();
  } catch (err) {
    console.log('quarterback caught:', +err);
  }
}

let iterator6 = quarterback();

iterator6.next(); // { value:1, done:false}
iterator6.next(); // { value:2, done:false}
iterator6.throw('Pass to receiver'); // will be caught inside of receiver()
// receiver caught: Pass to receiver

iterator6.next(); // { value:undefined, done:true} No error!

// QUESTIONS THAT REMAIN:
// How do generators help with async code patterns?  STAY TUNED!
