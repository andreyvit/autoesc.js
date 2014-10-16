var assert = require('assert');
var esc = require('../index');

describe("esc", function() {

    it("should expose errTo function", function() {
        assert.equal(typeof(esc.errTo), 'function');
    });

    describe("magic callback", function() {
        it("should forward the argument to the original callback as a successful result", function(done) {
            var foo = esc(function (arg, autocb) {
                autocb(arg);
            });
            foo(42, function(err, res) {
                assert.ok(err === null);
                assert.equal(res, 42);
                done();
            })
        });

        describe("when the argument is an instance of Error", function() {
            it("should forward the argument to the original callback as an error", function(done) {
                var foo = esc(function (autocb) {
                    autocb(new Error('boom'));
                });
                foo(function(err, res) {
                    assert.ok(err instanceof Error);
                    assert.equal(err.message, 'boom');
                    assert.equal(typeof(res), 'undefined');
                    done();
                })
            });
        });

        describe("when the argument is another callback", function() {
            describe("the decorated callback", function() {
                it("should short-circuit errors to the original callback", function(done) {
                    var foo = esc(function (autocb) {
                        failing(autocb(function(result) {
                            assert.fail();
                        }));
                    });
                    foo(function(err, res) {
                        assert.equal(err.message, 'boom');
                        assert.equal(typeof(res), 'undefined');
                        done();
                    })
                });

                it("should forward successful results to the normal callback", function(done) {
                    var foo = esc(function (autocb) {
                        succeeding(autocb(function(result) {
                            autocb(result * 2);
                        }));
                    });
                    foo(function(err, res) {
                        assert.ok(err === null);
                        assert.equal(res, 84);
                        done();
                    })
                });
            });
        });
    });

    describe("when an error is thrown on initial invocation", function() {
        it("should forward the error to the original callback", function(done) {
            var foo = esc(function (autocb) {
                throw new Error('boom');
            });
            foo(function(err, res) {
                assert.equal(err.message, 'boom');
                assert.equal(typeof(res), 'undefined');
                done();
            })
        });
    });

    describe("when an error is thrown on a subsequent invocation", function() {
        it("should forward the error to the original callback", function(done) {
            var foo = esc(function (autocb) {
                succeeding(autocb(function(result) {
                    throw new Error('boom');
                }));
            });
            foo(function(err, res) {
                assert.equal(err.message, 'boom');
                assert.equal(typeof(res), 'undefined');
                done();
            })
        });
    });
});

function succeeding(callback) {
    setImmediate(function() {
        callback(null, 42);
    });
}

function failing(callback) {
    setImmediate(function() {
        callback(new Error('boom'));
    });
}
