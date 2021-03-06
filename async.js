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

async.all = async.group = function (fn) {
	return fn && async(function (async) {
		async.all(function (all) {
			fn(all.then(function () {
				async.complete();
			}));
		});
	});
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
	return a;
};
async.only = function (fn) {
	return async().only(fn);
};

(typeof module)[0] === 'o' && module && module.exports && (
	module.exports = async
);
