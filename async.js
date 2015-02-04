function async (calls) {
	var children = [],
	i,ln,r,
	scope,
	parent = undefined,
	called = false,
	not_ready = 0,
	args = undefined,
	run_call = false,
	self_invoked = false,
	child,
	child_call,
	then = [],
	behavior;
 
	function accessor (fn) {
		return (
			child = async().$$parent(accessor).calls(fn),
			children.push(child),
			child
		);
	}
	accessor.$$accessor = true;
	accessor.$$parent = function (p) {
		if (arguments.length) {
			this.parent = parent = p;
			return this;
		} 
		return parent;
	};
	accessor.all = accessor.group = function (fn) {
		return accessor().$$all().calls(fn);
	};
	accessor.$$all = function () {
		this.behavior = behavior = async.ALL;
		return this;
	};
	accessor.any = function (fn) {
		return accessor().$$any().calls(fn);
	};
	accessor.$$any = function () {
		behavior = async.ANY;
		return this;
	};
	accessor.calls = function (fn) {
		not_ready++;
		fn && fn(this);
		not_ready--;
		(r||called) && this.complete();
		//calls = fn;
		return this;
	};
	accessor.complete = function (a) {
		if (accessor.$$complete) {
			return accessor;
		}
		args = arguments;
		scope = this;
		called = !accessor.$$child_call;
		if (behavior === async.ALL) {
			r = true;
			for (i=0,ln=children.length;i<ln;i++) {
				if (!children[i].$$complete) {
					r = false;
					break;
				}
			}
		}  else if (behavior === async.ANY) {
			r = false;
			for (i=0,ln=children.length;i<ln;i++) {
				if (children[i].$$complete) {
					r = true;
					break;
				}
			}
		} else {
			r = called;
		}
		//console.error(not_ready);
		//console.error(r,called);
		//console.error(then);
		(!not_ready) && (r||called) && (
			accessor.$$complete = true,
			called = false,
			then.forEach(function (t) {
				args !== undefined && (
					t.apply(scope,args),
					true
				) || t.call(scope);
			}),
			parent && (
				parent.$$child_call = true,
				parent.complete(),
				parent.$$child_call = false
			)
		);
		return this;
	};
	accessor.complete.then = function (fn) {
		accessor.then.call(accessor,fn);
		return this;
	}
	accessor.only = function (fn) {
		var me = this;
		return this(function () {}).then(function () {
			fn && fn.apply(this,arguments);
			console.error(behavior);
			if (!behavior) {
				me.complete.apply(this,arguments);
			}
		}).complete;
	};
	accessor.then = function (fn) {
		//TODO
		!this.$$complete ? then.push(fn):(
			args !== undefined && (
				scope !== undefined && (fn.apply(scope,args),true) || 
				fn.apply(this,args),
				true
			) || (
				fn()
			)
		);
		return this;
	};
	if (typeof waitsFor === 'function') {
		waitsFor(function () {
			return accessor.$$complete;
		});
		runs(function () {
			//empty fn
		});
	}
	calls && calls(accessor);
	return accessor;
}
async.ALL = 1;
async.ANY = 2;
/*
 *function async (calls) {
 *        var children = [],
 *        child,
 *        i,ln,
 *        scope,
 *        args,
 *        parent = undefined,
 *        complete,
 *        called = false,
 *        ready = false,
 *        child_call = false,
 *        child_any = false,
 *        result = undefined,
 *        run_call = false;
 *        function accessor () {
 *                var r = called;
 *                !child_call && (
 *                        (complete 
 *                                ? (complete.apply(this,arguments) && (r = called = true))
 *                                : (r = called = true)
 *                        ) && (
 *                                scope = this,
 *                                args = arguments
 *                ));
 *                if (!child_any) {
 *                        for (i=0,ln=children.length;i<ln;i++) {
 *                                child = children[i];
 *                                if (!children[i].$$any && !children[i].$$complete) {
 *                                        r = false;
 *                                        break;
 *                                }
 *                        }
 *                } else {
 *                        for (i=0,ln=children.length;i<ln;i++) {
 *                                child = children[i];
 *                                child.$$any && (child.$$complete = true);
 *                        }
 *                }
 *                if (ready && r) {
 *                        accessor.$$complete = true;
 *                        result = (calls && calls.apply(scope,args));
 *                        if (parent) {
 *                                parent.$$call_by_child(accessor);
 *                        }
 *                }
 *                return result;
 *
 *        }
 *        accessor.$$accessor = true;
 *        accessor.$$call_by_child = function (child) {
 *                child_call = true;
 *                child_any = child.$$any;
 *                try {
 *                        accessor();
 *                } catch (e) {
 *                        child_call = false;
 *                        throw e;
 *                } finally {
 *                        child_call = false;
 *                }
 *        }
 *        accessor.$$parent = function (p) {
 *                if (arguments.length) {
 *                        parent = p;
 *                        return this;
 *                } 
 *                return parent;
 *        };
 *        accessor.wait = function (fn) {
 *                return fn && (
 *                        i = children.push(async(fn)) - 1,
 *                        i = children[i].$$parent(accessor),
 *                        i
 *                );
 *        };
 *        accessor.wait.only = function (fn) {
 *                return (i = wait(fn)) && (i.ready());
 *        };
 *        accessor.all = accessor.group = function (fn) {
 *                fn && fn(accessor.wait);
 *                return this;
 *        };
 *        function any (fn) {
 *                (i = accessor.wait(fn)) && (i.$$any = true); 
 *                return i;
 *        }
 *        any.only = function (fn) {
 *                return (i = any(fn)) && (i.ready());
 *        };
 *        accessor.any = function (fn) {
 *                fn && fn(any);
 *                return this;
 *        };
 *        accessor.only = function (fn) {
 *                return accessor.calls(fn).ready();
 *        };
 *        accessor.complete = function () {
 *                called = true;
 *        };
 *        accessor.ready = function (optional_function) {
 *                //optional_function && (complete = optional_function);
 *                //ready = true;
 *                //called && accessor();
 *                return this;
 *        };
 *        accessor.calls = function (fn) {
 *                if (arguments.length) {
 *                        calls = fn;
 *                        return this;
 *                } 
 *                return calls;
 *        };
 *        waitsFor(function () {
 *                return accessor.$$complete;
 *        });
 *        runs(function () {
 *                //empty fn
 *        });
 *        return accessor;
 *}
 */

async.all = async.group = function (fn) {
	return fn && async(function (async) {
		async.all(function (all) {
			fn(all.then(function () {
				async.complete();
			}));
		});
	});
	//a();
	//return a;
	//return async().group(fn);
};
async.any = function (fn) {
	return fn && async(function (async) {
		async.any(function (any) {
			fn(any.then(function () {
				async.complete();
			}));
		});
	});
};
async.any = function (fn) {
	var a = async().any(fn);
	//a();
	return a;
	//return async().any(fn);
};
async.only = function (fn) {
	return async().only(fn);
};
//async.ready = function (fn) {
	//return async().ready(fn);
//};
//async.any.ready = async.ready.any = function (fn) {
	//var a = async().ready().any(fn);
	//a();
	//return a;
//};
//async.all.ready = async.ready.all = async.group.ready = async.ready.group = function (fn) {
	//var a = async().ready().any(fn);
	//a();
	//return a;
//};

(typeof module)[0] === 'o' && module && module.exports && (
	module.exports = async
);
