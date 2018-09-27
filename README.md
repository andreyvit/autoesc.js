# Error Short Circuiter (ESC) for IcedCoffeeScript's autocb

[![Greenkeeper badge](https://badges.greenkeeper.io/andreyvit/autoesc.js.svg)](https://greenkeeper.io/)

Provides a very concise implementaiton of ESC to be used with IcedCoffeeScript's autocb feature.

Design goals:

* minimal code noise
* safe where possible

Features:

* designed for autocb functions
* minimal typing (just prepend “autocb” to “defer” and boom, all errors are handled)
* fails fast (no way to make hard-to-find error handling mistakes)
* catches errors (wraps the function in a try-catch block, sends all errors to the callback)
* guarantees that the callback is only called once, even if multiple errors occur

See below for a detailed explanation of this package and Error Short Circuiters in general.

Installation:

    npm install autoesc


## How do you handle errors in IcedCoffeeScript?

### 1. Manually

Consider the following function that reads a file, parses it and does some processing:

    myAsyncFunc1 = (path, callback) ->
      await fs.readFile(path, 'utf8', defer(err, raw))
      if err then return callback(err)

      try
        data = JSON.parse(raw)
      catch e
        return callback(e)

      await Image.findById(data.imageId, defer(err, image))
      if err then return callback(err)

      await checkPermissions(globalUser, image, defer(err, permitted))
      if err then return callback(err)
      if !permitted
        return callback(new Error('access denied'))

      callback null, image


### 2. With errTo

It's a mess, and a popular way to deal with it is to use an [Error Short Circuiter (ESC)](http://stackoverflow.com/a/16654079).

One good implementation is [errTo](https://github.com/ashtuchkin/errTo), resulting in the following code:

    errTo = require('errto')

    myAsyncFunc2 = (path, callback) ->
      await fs.readFile(path, 'utf8', errTo(callback, defer raw))

      try
        data = JSON.parse(raw)
      catch e
        return callback(e)

      await Image.findById(data.imageId, errTo(callback, defer image))

      await checkPermissions(globalUser, image, errTo(callback, defer permitted))
      if !permitted
        return callback(new Error('access denied'))

      callback null, image


### 3. With bound errTo

That's much better, but you can make the code more concise by binding errTo:

    errTo = require('errto')

    myAsyncFunc3 = (path, callback) ->
      esc = errTo.bind(null, callback)

      await fs.readFile(path, 'utf8', esc defer raw)

      try
        data = JSON.parse(raw)
      catch e
        return callback(e)

      await Image.findById(data.imageId, esc defer image)

      await checkPermissions(globalUser, image, esc defer permitted)
      if !permitted
        return callback(new Error('access denied'))

      callback null, image


### 4. With autoesc

This package allows you to write:

    esc = require('autoesc')

    myAsyncFunc4 = esc (path, autocb) ->
      await fs.readFile(path, 'utf8', autocb defer raw)

      data = JSON.parse(raw)

      await Image.findById(data.imageId, autocb defer image)

      await checkPermissions(globalUser, image, autocb defer permitted)
      if !permitted
        throw new Error('access denied')

      return image

Now, this is not for everyone; some may feel there's too much magic involved. Also:

* You cannot return successful results of type Error
* You cannot return functions as successful results

The advantage is that there's no way to screw up callbacks and error handling with autocb + autoesc:

* If you forget to write “esc” or “autocb defer”, the function will fail in every case, so you'll catch the error quickly.
* All errors (including runtime exceptions thrown by the function itself) will be handled, whatever you do.
* The callback will be called exactly once, whatever you do.


## Recipe

1. `esc = require('autoesc')`
2. Decorate your async functions with `esc`.
3. Use `autocb` to let IcedCoffeeScript invoke callbacks for you.
4. Prepend `autocb` to `defer` to automatically handle errors.


## License

Copyright 2014, Andrey Tarantsov. Licensed under MIT.
