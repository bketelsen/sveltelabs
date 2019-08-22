
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function (exports) {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement !== 'undefined') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set() {
                // overridden by instance, if it has props
            }
        };
    }

    /* src/App.svelte generated by Svelte v3.9.1 */

    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	var div, slot0, t, span, slot1, svg, g, path, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			slot0 = element("slot");
    			t = space();
    			span = element("span");
    			slot1 = element("slot");
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path = svg_element("path");
    			this.c = noop;
    			add_location(slot0, file, 106, 2, 2898);
    			attr(path, "d", ctx.closePath);
    			add_location(path, file, 113, 9, 3156);
    			add_location(g, file, 113, 6, 3153);
    			attr(svg, "height", "12px");
    			attr(svg, "width", "12px");
    			attr(svg, "viewBox", "0 0 47.971 47.971");
    			set_style(svg, "enable-background", "new 0 0 47.971 47.971");
    			add_location(svg, file, 111, 4, 3030);
    			attr(slot1, "name", "close");
    			add_location(slot1, file, 110, 4, 3006);
    			attr(span, "fixed", ctx.fixed);
    			attr(span, "role", "button");
    			add_location(span, file, 109, 2, 2940);
    			attr(div, "role", "alert");
    			add_location(div, file, 104, 0, 2876);
    			dispose = listen(span, "click", dispatchCloseEvent);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, slot0);
    			append(div, t);
    			append(div, span);
    			append(span, slot1);
    			append(slot1, svg);
    			append(svg, g);
    			append(g, path);
    		},

    		p: function update(changed, ctx) {
    			if (changed.fixed) {
    				attr(span, "fixed", ctx.fixed);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function dispatchCloseEvent(e) {

      // 1. Create the custom event.
      const event = new CustomEvent("close", {
        detail: `alert-box was closed.`,
        bubbles: true,
        cancelable: true,
        composed: true // makes the event jump shadow DOM boundary
      });

      // 2. Dispatch the custom event.
      this.dispatchEvent(event);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { id = "", primary = false, success = false, warning = false, danger = false, dark = false, fixed = false } = $$props;

      let closePath = `M28.228,23.986L47.092,5.122c1.172-1.171,1.172-3.071,0-4.242c-1.172-1.172-3.07-1.172-4.242,0L23.986,19.744L5.121,0.88
          c-1.172-1.172-3.07-1.172-4.242,0c-1.172,1.171-1.172,3.071,0,4.242l18.865,18.864L0.879,42.85c-1.172,1.171-1.172,3.071,0,4.242
          C1.465,47.677,2.233,47.97,3,47.97s1.535-0.293,2.121-0.879l18.865-18.864L42.85,47.091c0.586,0.586,1.354,0.879,2.121,0.879
          s1.535-0.293,2.121-0.879c1.172-1.171,1.172-3.071,0-4.242L28.228,23.986z`;

    	const writable_props = ['id', 'primary', 'success', 'warning', 'danger', 'dark', 'fixed'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<alert-box> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('primary' in $$props) $$invalidate('primary', primary = $$props.primary);
    		if ('success' in $$props) $$invalidate('success', success = $$props.success);
    		if ('warning' in $$props) $$invalidate('warning', warning = $$props.warning);
    		if ('danger' in $$props) $$invalidate('danger', danger = $$props.danger);
    		if ('dark' in $$props) $$invalidate('dark', dark = $$props.dark);
    		if ('fixed' in $$props) $$invalidate('fixed', fixed = $$props.fixed);
    	};

    	return {
    		id,
    		primary,
    		success,
    		warning,
    		danger,
    		dark,
    		fixed,
    		closePath
    	};
    }

    class App extends SvelteElement {
    	constructor(options) {
    		super();

    		this.shadowRoot.innerHTML = `<style>div{border-radius:5px;padding:12px;display:flex;align-items:center;justify-content:space-between;background:var(--alert-box-bg, #e2e3e5);color:var(--alert-box-text, #383d41);width:var(--alert-box-width, auto)}:host([primary]){--alert-box-bg:#cce5ff;--alert-box-text:#004085}:host([success]){--alert-box-bg:#d4edda;--alert-box-text:#155724}:host([warning]){--alert-box-bg:#fff3cd;--alert-box-text:#856404}:host([danger]){--alert-box-bg:#f8d7da;--alert-box-text:#721c24}:host([dark]){--alert-box-bg:#292b2c;--alert-box-text:#cccccc}:host([fixed]) span{display:none}span{margin-left:10px;cursor:pointer}svg{fill:var(--alert-box-text)}
		/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXBwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8IS0tIFxuVGhpcyB0ZWxscyB0aGUgU3ZlbHRlIGNvbXBpbGVyIHRoYXQgdGhpcyBmaWxlIGlzIGEgY3VzdG9tIGVsZW1lbnQuIFxuV2UgYWxzbyBoYXZlIHRvIGluY2x1ZGUgdGhlIFwiY3VzdG9tRWxlbWVudDogdHJ1ZVwiIGNvbXBpbGVyIHNldHRpbmcgaW4gcm9sbHVwIGNvbmZpZ3VyYXRpb24uXG4tLT5cbjxzdmVsdGU6b3B0aW9ucyB0YWc9XCJhbGVydC1ib3hcIiAvPlxuXG48c2NyaXB0PlxuICBleHBvcnQgbGV0IGlkID0gXCJcIjtcblxuICAvLyBTdHlsaW5nXG4gIGV4cG9ydCBsZXQgcHJpbWFyeSA9IGZhbHNlO1xuICBleHBvcnQgbGV0IHN1Y2Nlc3MgPSBmYWxzZTtcbiAgZXhwb3J0IGxldCB3YXJuaW5nID0gZmFsc2U7XG4gIGV4cG9ydCBsZXQgZGFuZ2VyID0gZmFsc2U7XG4gIGV4cG9ydCBsZXQgZGFyayA9IGZhbHNlO1xuIFxuICAvKlxuICAgSWYgZml4ZWQgaXMgcGFzc2VkIGFzIGFuIGF0dHJpYnV0ZSwgdGhlIGNsb3NlIChYKSBpY29uIGRvZXMgbm90IFxuICAgc2hvdyB1cCBhbmQgdGhlIHVzZXIgY2Fubm90IGNsb3NlIHRoZSBhbGVydC1ib3g7XG4gICAqL1xuICBleHBvcnQgbGV0IGZpeGVkID0gZmFsc2U7XG5cbiAgLypcbiAgQ3JlYXRlIGEgY3VzdG9tIFwiY2xvc2VcIiBldmVudCB0aGF0IGlzIGZpcmVkIHdoZW4gdGhlIHVzZXIgY2xpY2tzIG9uIHRoZSBjbG9zZSAoWCkgaWNvbi5cbiAgVXNlcnMgY2FuIHN1YnNjcmliZSB0byB0aGlzIGV2ZW50IGJ5IHRhcmdldGluZyB0aGUgY3VzdG9tIGVsZW1lbnQgYW5kIGFkZGluZyBhbiBldmVudFxuICBsaXN0ZW5lciBmb3IgdGhpcyBjdXN0b20gZXZlbnQuIEl0J3MgY29tcGxldGVseSB1cCB0byB0aGUgZW5kIHVzZXIgdG8gZGVjaWRlIGhvdyB0aGV5IHdhbnQgdG8gXG4gIGhhbmRsZSB0aGUgY2xvc2luZyBvZiB0aGUgZWxlbWVudC4gaS5lIGhpZGRlbiB2cy4gZGlzcGxheSwgYXBwbHkgYW5pbWF0aW9uLCBldGMuLi5cbiAgVGhpcyBpcyBkZW1vbnN0cmF0ZWQgaW4gdGhlIGluZGV4Lmh0bWwgZmlsZS5cbiAgKi9cbiAgZnVuY3Rpb24gZGlzcGF0Y2hDbG9zZUV2ZW50KGUpIHtcblxuICAgIC8vIDEuIENyZWF0ZSB0aGUgY3VzdG9tIGV2ZW50LlxuICAgIGNvbnN0IGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KFwiY2xvc2VcIiwge1xuICAgICAgZGV0YWlsOiBgYWxlcnQtYm94IHdhcyBjbG9zZWQuYCxcbiAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAgY29tcG9zZWQ6IHRydWUgLy8gbWFrZXMgdGhlIGV2ZW50IGp1bXAgc2hhZG93IERPTSBib3VuZGFyeVxuICAgIH0pO1xuXG4gICAgLy8gMi4gRGlzcGF0Y2ggdGhlIGN1c3RvbSBldmVudC5cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgbGV0IGNsb3NlUGF0aCA9IGBNMjguMjI4LDIzLjk4Nkw0Ny4wOTIsNS4xMjJjMS4xNzItMS4xNzEsMS4xNzItMy4wNzEsMC00LjI0MmMtMS4xNzItMS4xNzItMy4wNy0xLjE3Mi00LjI0MiwwTDIzLjk4NiwxOS43NDRMNS4xMjEsMC44OFxuICAgICAgICAgIGMtMS4xNzItMS4xNzItMy4wNy0xLjE3Mi00LjI0MiwwYy0xLjE3MiwxLjE3MS0xLjE3MiwzLjA3MSwwLDQuMjQybDE4Ljg2NSwxOC44NjRMMC44NzksNDIuODVjLTEuMTcyLDEuMTcxLTEuMTcyLDMuMDcxLDAsNC4yNDJcbiAgICAgICAgICBDMS40NjUsNDcuNjc3LDIuMjMzLDQ3Ljk3LDMsNDcuOTdzMS41MzUtMC4yOTMsMi4xMjEtMC44NzlsMTguODY1LTE4Ljg2NEw0Mi44NSw0Ny4wOTFjMC41ODYsMC41ODYsMS4zNTQsMC44NzksMi4xMjEsMC44NzlcbiAgICAgICAgICBzMS41MzUtMC4yOTMsMi4xMjEtMC44NzljMS4xNzItMS4xNzEsMS4xNzItMy4wNzEsMC00LjI0MkwyOC4yMjgsMjMuOTg2emBcblxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgLyogXG4gIFNldHRpbmcgY3VzdG9tIGNzcyB2YXJpYWJsZXMgZW5hYmxlcyB0aGUgdXNlciB0byB1c2UgY3NzIHRvIHRhcmdldCBhIGN1c3RvbVxuICBlbGVtZW50IGJ5IGFuIGF0dHJpYnV0ZSBhbmQgY2hhbmdlIGNzcyBwcm9wZXJ0aWVzIHRoYXQgeW91IHdhbnQgdG8gZXhwb3NlLlxuICAqL1xuICBkaXYge1xuICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICBwYWRkaW5nOiAxMnB4O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgLyogQ3VzdG9taXphYmxlIFN0eWxlcyAqL1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWFsZXJ0LWJveC1iZywgI2UyZTNlNSk7XG4gICAgY29sb3I6IHZhcigtLWFsZXJ0LWJveC10ZXh0LCAjMzgzZDQxKTtcbiAgICB3aWR0aDogdmFyKC0tYWxlcnQtYm94LXdpZHRoLCBhdXRvKTtcbiAgfVxuICA6aG9zdChbcHJpbWFyeV0pIHtcbiAgICAtLWFsZXJ0LWJveC1iZzogI2NjZTVmZjtcbiAgICAtLWFsZXJ0LWJveC10ZXh0OiAjMDA0MDg1O1xuICB9XG4gIDpob3N0KFtzdWNjZXNzXSkge1xuICAgIC0tYWxlcnQtYm94LWJnOiAjZDRlZGRhO1xuICAgIC0tYWxlcnQtYm94LXRleHQ6ICMxNTU3MjQ7XG4gIH1cbiAgOmhvc3QoW3dhcm5pbmddKSB7XG4gICAgLS1hbGVydC1ib3gtYmc6ICNmZmYzY2Q7XG4gICAgLS1hbGVydC1ib3gtdGV4dDogIzg1NjQwNDtcbiAgfVxuICA6aG9zdChbZGFuZ2VyXSkge1xuICAgIC0tYWxlcnQtYm94LWJnOiAjZjhkN2RhO1xuICAgIC0tYWxlcnQtYm94LXRleHQ6ICM3MjFjMjQ7XG4gIH1cbiBcbiAgOmhvc3QoW2RhcmtdKSB7XG4gICAgLS1hbGVydC1ib3gtYmc6ICMyOTJiMmM7XG4gICAgLS1hbGVydC1ib3gtdGV4dDogI2NjY2NjYztcbiAgfVxuXG4gIDpob3N0KFtmaXhlZF0pIHNwYW4ge1xuICAgIGRpc3BsYXk6IG5vbmU7XG4gIH1cblxuICBzcGFuIHtcbiAgICBtYXJnaW4tbGVmdDogMTBweDtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gIH1cblxuICBzdmcge1xuICAgIGZpbGw6IHZhcigtLWFsZXJ0LWJveC10ZXh0KTtcbiAgfVxuXG5cbjwvc3R5bGU+XG5cbjxkaXYgcm9sZT1cImFsZXJ0XCI+XG5cbiAgPHNsb3QgLz5cblxuICA8IS0tIFRoZSBjbG9zZSAoWCkgaWNvbiAtLT5cbiAgPHNwYW4ge2ZpeGVkfSBvbjpjbGljaz1cIntkaXNwYXRjaENsb3NlRXZlbnR9XCIgcm9sZT1cImJ1dHRvblwiID5cbiAgICA8c2xvdCBuYW1lPVwiY2xvc2VcIj5cbiAgICA8c3ZnICBoZWlnaHQ9XCIxMnB4XCIgd2lkdGg9XCIxMnB4XCJcbiAgICAgIHZpZXdCb3g9XCIwIDAgNDcuOTcxIDQ3Ljk3MVwiIHN0eWxlPVwiZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0Ny45NzEgNDcuOTcxO1wiPlxuICAgICAgPGc+PHBhdGggZD17Y2xvc2VQYXRofS8+PC9nPlxuICAgPC9zdmc+XG4gIDwvc2xvdD5cbiAgPC9zcGFuPlxuXG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1REUsR0FBRyxBQUFDLENBQUMsQUFDSCxhQUFhLENBQUUsR0FBRyxDQUNsQixPQUFPLENBQUUsSUFBSSxDQUNiLE9BQU8sQ0FBRSxJQUFJLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsZUFBZSxDQUFFLGFBQWEsQ0FFOUIsVUFBVSxDQUFFLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUN4QyxLQUFLLENBQUUsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FDckMsS0FBSyxDQUFFLElBQUksaUJBQWlCLENBQUMsS0FBSyxDQUFDLEFBQ3JDLENBQUMsQUFDRCxNQUFNLFNBQVMsQ0FBQyxBQUFDLENBQUMsQUFDaEIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsZ0JBQWdCLENBQUUsT0FBTyxBQUMzQixDQUFDLEFBQ0QsTUFBTSxTQUFTLENBQUMsQUFBQyxDQUFDLEFBQ2hCLGNBQWMsQ0FBRSxPQUFPLENBQ3ZCLGdCQUFnQixDQUFFLE9BQU8sQUFDM0IsQ0FBQyxBQUNELE1BQU0sU0FBUyxDQUFDLEFBQUMsQ0FBQyxBQUNoQixjQUFjLENBQUUsT0FBTyxDQUN2QixnQkFBZ0IsQ0FBRSxPQUFPLEFBQzNCLENBQUMsQUFDRCxNQUFNLFFBQVEsQ0FBQyxBQUFDLENBQUMsQUFDZixjQUFjLENBQUUsT0FBTyxDQUN2QixnQkFBZ0IsQ0FBRSxPQUFPLEFBQzNCLENBQUMsQUFFRCxNQUFNLE1BQU0sQ0FBQyxBQUFDLENBQUMsQUFDYixjQUFjLENBQUUsT0FBTyxDQUN2QixnQkFBZ0IsQ0FBRSxPQUFPLEFBQzNCLENBQUMsQUFFRCxNQUFNLE9BQU8sQ0FBQyxDQUFDLElBQUksQUFBQyxDQUFDLEFBQ25CLE9BQU8sQ0FBRSxJQUFJLEFBQ2YsQ0FBQyxBQUVELElBQUksQUFBQyxDQUFDLEFBQ0osV0FBVyxDQUFFLElBQUksQ0FDakIsTUFBTSxDQUFFLE9BQU8sQUFDakIsQ0FBQyxBQUVELEdBQUcsQUFBQyxDQUFDLEFBQ0gsSUFBSSxDQUFFLElBQUksZ0JBQWdCLENBQUMsQUFDN0IsQ0FBQyJ9 */</style>`;

    		init(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, ["id", "primary", "success", "warning", "danger", "dark", "fixed"]);

    		if (options) {
    			if (options.target) {
    				insert(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["id","primary","success","warning","danger","dark","fixed"];
    	}

    	get id() {
    		return this.$$.ctx.id;
    	}

    	set id(id) {
    		this.$set({ id });
    		flush();
    	}

    	get primary() {
    		return this.$$.ctx.primary;
    	}

    	set primary(primary) {
    		this.$set({ primary });
    		flush();
    	}

    	get success() {
    		return this.$$.ctx.success;
    	}

    	set success(success) {
    		this.$set({ success });
    		flush();
    	}

    	get warning() {
    		return this.$$.ctx.warning;
    	}

    	set warning(warning) {
    		this.$set({ warning });
    		flush();
    	}

    	get danger() {
    		return this.$$.ctx.danger;
    	}

    	set danger(danger) {
    		this.$set({ danger });
    		flush();
    	}

    	get dark() {
    		return this.$$.ctx.dark;
    	}

    	set dark(dark) {
    		this.$set({ dark });
    		flush();
    	}

    	get fixed() {
    		return this.$$.ctx.fixed;
    	}

    	set fixed(fixed) {
    		this.$set({ fixed });
    		flush();
    	}
    }

    customElements.define("alert-box", App);

    /* src/SvelteLab.svelte generated by Svelte v3.9.1 */

    const file$1 = "src/SvelteLab.svelte";

    function create_fragment$1(ctx) {
    	var nav, a0, t0, t1, button0, span0, t2, div0, ul, li, a1, t3, span1, t5, form, input, t6, button1, t8, main, slot0, section, div1, h1, t9, t10, p0, t11, t12, div2, slot1, t13, footer, div3, p1, a2, t15, slot2;

    	return {
    		c: function create() {
    			nav = element("nav");
    			a0 = element("a");
    			t0 = text(ctx.title);
    			t1 = space();
    			button0 = element("button");
    			span0 = element("span");
    			t2 = space();
    			div0 = element("div");
    			ul = element("ul");
    			li = element("li");
    			a1 = element("a");
    			t3 = text("Home\n          ");
    			span1 = element("span");
    			span1.textContent = "(current)";
    			t5 = space();
    			form = element("form");
    			input = element("input");
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Search";
    			t8 = space();
    			main = element("main");
    			slot0 = element("slot");
    			section = element("section");
    			div1 = element("div");
    			h1 = element("h1");
    			t9 = text(ctx.title);
    			t10 = space();
    			p0 = element("p");
    			t11 = text(ctx.jumbotron);
    			t12 = space();
    			div2 = element("div");
    			slot1 = element("slot");
    			t13 = space();
    			footer = element("footer");
    			div3 = element("div");
    			p1 = element("p");
    			a2 = element("a");
    			a2.textContent = "Back to top";
    			t15 = space();
    			slot2 = element("slot");
    			this.c = noop;
    			attr(a0, "class", "navbar-brand");
    			attr(a0, "href", "/");
    			add_location(a0, file$1, 11, 2, 371);
    			attr(span0, "class", "navbar-toggler-icon");
    			add_location(span0, file$1, 20, 4, 649);
    			attr(button0, "class", "navbar-toggler");
    			attr(button0, "type", "button");
    			attr(button0, "data-toggle", "collapse");
    			attr(button0, "data-target", "#navbarSupportedContent");
    			attr(button0, "aria-controls", "navbarSupportedContent");
    			attr(button0, "aria-expanded", "false");
    			attr(button0, "aria-label", "Toggle navigation");
    			add_location(button0, file$1, 12, 2, 418);
    			attr(span1, "class", "sr-only");
    			add_location(span1, file$1, 28, 10, 902);
    			attr(a1, "class", "nav-link");
    			attr(a1, "href", "#");
    			add_location(a1, file$1, 26, 8, 847);
    			attr(li, "class", "nav-item active");
    			add_location(li, file$1, 25, 6, 810);
    			attr(ul, "class", "navbar-nav mr-auto");
    			add_location(ul, file$1, 24, 4, 772);
    			attr(input, "class", "form-control mr-sm-2");
    			attr(input, "type", "search");
    			attr(input, "placeholder", "Search");
    			attr(input, "aria-label", "Search");
    			add_location(input, file$1, 34, 6, 1027);
    			attr(button1, "class", "btn btn-outline-info my-2 my-sm-0");
    			attr(button1, "type", "submit");
    			add_location(button1, file$1, 39, 6, 1159);
    			attr(form, "class", "form-inline my-2 my-lg-0");
    			add_location(form, file$1, 33, 4, 981);
    			attr(div0, "class", "collapse navbar-collapse");
    			attr(div0, "id", "navbarSupportedContent");
    			add_location(div0, file$1, 23, 2, 701);
    			attr(nav, "class", "navbar navbar-expand-lg navbar-dark bg-dark");
    			add_location(nav, file$1, 10, 0, 311);
    			attr(h1, "class", "jumbotron-heading");
    			add_location(h1, file$1, 49, 8, 1407);
    			attr(p0, "class", "lead text-muted");
    			add_location(p0, file$1, 50, 8, 1458);
    			attr(div1, "class", "container");
    			add_location(div1, file$1, 48, 6, 1375);
    			attr(section, "class", "jumbotron text-center");
    			add_location(section, file$1, 47, 4, 1329);
    			attr(slot0, "name", "header");
    			add_location(slot0, file$1, 46, 2, 1304);
    			add_location(slot1, file$1, 57, 2, 1585);
    			attr(div2, "class", "container");
    			add_location(div2, file$1, 56, 2, 1559);
    			attr(main, "role", "main");
    			add_location(main, file$1, 45, 0, 1283);
    			attr(a2, "href", "#");
    			add_location(a2, file$1, 63, 6, 1702);
    			attr(p1, "class", "float-right");
    			add_location(p1, file$1, 62, 4, 1672);
    			attr(slot2, "name", "footer");
    			add_location(slot2, file$1, 65, 4, 1743);
    			attr(div3, "class", "container");
    			add_location(div3, file$1, 61, 2, 1644);
    			attr(footer, "class", "text-muted");
    			add_location(footer, file$1, 60, 0, 1614);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, nav, anchor);
    			append(nav, a0);
    			append(a0, t0);
    			append(nav, t1);
    			append(nav, button0);
    			append(button0, span0);
    			append(nav, t2);
    			append(nav, div0);
    			append(div0, ul);
    			append(ul, li);
    			append(li, a1);
    			append(a1, t3);
    			append(a1, span1);
    			append(div0, t5);
    			append(div0, form);
    			append(form, input);
    			append(form, t6);
    			append(form, button1);
    			insert(target, t8, anchor);
    			insert(target, main, anchor);
    			append(main, slot0);
    			append(slot0, section);
    			append(section, div1);
    			append(div1, h1);
    			append(h1, t9);
    			append(div1, t10);
    			append(div1, p0);
    			append(p0, t11);
    			append(main, t12);
    			append(main, div2);
    			append(div2, slot1);
    			insert(target, t13, anchor);
    			insert(target, footer, anchor);
    			append(footer, div3);
    			append(div3, p1);
    			append(p1, a2);
    			append(div3, t15);
    			append(div3, slot2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.title) {
    				set_data(t0, ctx.title);
    				set_data(t9, ctx.title);
    			}

    			if (changed.jumbotron) {
    				set_data(t11, ctx.jumbotron);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(nav);
    				detach(t8);
    				detach(main);
    				detach(t13);
    				detach(footer);
    			}
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { title = "Snack Site", jumbotron= "Something short and leading about the collection below—its contents, the creator, etc. Make it short and sweet, but not too short so folks don't simply skip over it entirely." } = $$props;

    	const writable_props = ['title', 'jumbotron'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<svelte-lab> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('jumbotron' in $$props) $$invalidate('jumbotron', jumbotron = $$props.jumbotron);
    	};

    	return { title, jumbotron };
    }

    class SvelteLab extends SvelteElement {
    	constructor(options) {
    		super();

    		init(this, { target: this.shadowRoot }, instance$1, create_fragment$1, safe_not_equal, ["title", "jumbotron"]);

    		if (options) {
    			if (options.target) {
    				insert(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["title","jumbotron"];
    	}

    	get title() {
    		return this.$$.ctx.title;
    	}

    	set title(title) {
    		this.$set({ title });
    		flush();
    	}

    	get jumbotron() {
    		return this.$$.ctx.jumbotron;
    	}

    	set jumbotron(jumbotron) {
    		this.$set({ jumbotron });
    		flush();
    	}
    }

    customElements.define("svelte-lab", SvelteLab);

    /* src/SvelteLabStep.svelte generated by Svelte v3.9.1 */

    const file$2 = "src/SvelteLabStep.svelte";

    function create_fragment$2(ctx) {
    	var h1, t0, t1, t2;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(ctx.name);
    			t2 = text("!");
    			this.c = noop;
    			add_location(h1, file$2, 11, 0, 140);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t0);
    			append(h1, t1);
    			append(h1, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.name) {
    				set_data(t1, ctx.name);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    			}
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { name = 'stranger' } = $$props;

    	const writable_props = ['name'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<svelte-lab-step> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	return { name };
    }

    class SvelteLabStep extends SvelteElement {
    	constructor(options) {
    		super();

    		this.shadowRoot.innerHTML = `<style>h1{color:purple}
		/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3ZlbHRlTGFiU3RlcC5zdmVsdGUiLCJzb3VyY2VzIjpbIlN2ZWx0ZUxhYlN0ZXAuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdmVsdGU6b3B0aW9ucyB0YWc9XCJzdmVsdGUtbGFiLXN0ZXBcIi8+XG48c2NyaXB0PlxuICBleHBvcnQgbGV0IG5hbWUgPSAnc3RyYW5nZXInO1xuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgaDEge1xuICAgIGNvbG9yOiBwdXJwbGU7XG4gIH1cbjwvc3R5bGU+XG5cbjxoMT5IZWxsbyB7bmFtZX0hPC9oMT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFNRSxFQUFFLEFBQUMsQ0FBQyxBQUNGLEtBQUssQ0FBRSxNQUFNLEFBQ2YsQ0FBQyJ9 */</style>`;

    		init(this, { target: this.shadowRoot }, instance$2, create_fragment$2, safe_not_equal, ["name"]);

    		if (options) {
    			if (options.target) {
    				insert(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["name"];
    	}

    	get name() {
    		return this.$$.ctx.name;
    	}

    	set name(name) {
    		this.$set({ name });
    		flush();
    	}
    }

    customElements.define("svelte-lab-step", SvelteLabStep);

    /* src/SvelteLabCard.svelte generated by Svelte v3.9.1 */

    const file$3 = "src/SvelteLabCard.svelte";

    function create_fragment$3(ctx) {
    	var div2, div0, t0, t1, div1, h5, t2, t3, h6, t4, t5, p, t6, t7, a, t8;

    	return {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(ctx.category);
    			t1 = space();
    			div1 = element("div");
    			h5 = element("h5");
    			t2 = text(ctx.title);
    			t3 = space();
    			h6 = element("h6");
    			t4 = text(ctx.subtitle);
    			t5 = space();
    			p = element("p");
    			t6 = text(ctx.body);
    			t7 = space();
    			a = element("a");
    			t8 = text(ctx.action);
    			this.c = noop;
    			attr(div0, "class", "card-header");
    			add_location(div0, file$3, 14, 2, 398);
    			attr(h5, "class", "card-title");
    			add_location(h5, file$3, 18, 4, 478);
    			attr(h6, "class", "card-subtitle mb-2 text-muted");
    			add_location(h6, file$3, 19, 4, 518);
    			attr(p, "class", "card-text");
    			add_location(p, file$3, 20, 4, 580);
    			attr(a, "href", ctx.actionLink);
    			attr(a, "class", "card-link");
    			add_location(a, file$3, 21, 4, 616);
    			attr(div1, "class", "card-body");
    			add_location(div1, file$3, 17, 2, 450);
    			attr(div2, "class", "card");
    			add_location(div2, file$3, 13, 0, 376);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div0, t0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div1, h5);
    			append(h5, t2);
    			append(div1, t3);
    			append(div1, h6);
    			append(h6, t4);
    			append(div1, t5);
    			append(div1, p);
    			append(p, t6);
    			append(div1, t7);
    			append(div1, a);
    			append(a, t8);
    		},

    		p: function update(changed, ctx) {
    			if (changed.category) {
    				set_data(t0, ctx.category);
    			}

    			if (changed.title) {
    				set_data(t2, ctx.title);
    			}

    			if (changed.subtitle) {
    				set_data(t4, ctx.subtitle);
    			}

    			if (changed.body) {
    				set_data(t6, ctx.body);
    			}

    			if (changed.action) {
    				set_data(t8, ctx.action);
    			}

    			if (changed.actionLink) {
    				attr(a, "href", ctx.actionLink);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div2);
    			}
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { title = 'My Card', subtitle = 'By Joshua Jones', body = "Some quick example text to build on the card title and make up the bulk of the card's content.", action = "Card Link", actionLink = "#", category = "unspecified" } = $$props;

    	const writable_props = ['title', 'subtitle', 'body', 'action', 'actionLink', 'category'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<svelte-lab-card> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('subtitle' in $$props) $$invalidate('subtitle', subtitle = $$props.subtitle);
    		if ('body' in $$props) $$invalidate('body', body = $$props.body);
    		if ('action' in $$props) $$invalidate('action', action = $$props.action);
    		if ('actionLink' in $$props) $$invalidate('actionLink', actionLink = $$props.actionLink);
    		if ('category' in $$props) $$invalidate('category', category = $$props.category);
    	};

    	return {
    		title,
    		subtitle,
    		body,
    		action,
    		actionLink,
    		category
    	};
    }

    class SvelteLabCard extends SvelteElement {
    	constructor(options) {
    		super();

    		init(this, { target: this.shadowRoot }, instance$3, create_fragment$3, safe_not_equal, ["title", "subtitle", "body", "action", "actionLink", "category"]);

    		if (options) {
    			if (options.target) {
    				insert(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["title","subtitle","body","action","actionLink","category"];
    	}

    	get title() {
    		return this.$$.ctx.title;
    	}

    	set title(title) {
    		this.$set({ title });
    		flush();
    	}

    	get subtitle() {
    		return this.$$.ctx.subtitle;
    	}

    	set subtitle(subtitle) {
    		this.$set({ subtitle });
    		flush();
    	}

    	get body() {
    		return this.$$.ctx.body;
    	}

    	set body(body) {
    		this.$set({ body });
    		flush();
    	}

    	get action() {
    		return this.$$.ctx.action;
    	}

    	set action(action) {
    		this.$set({ action });
    		flush();
    	}

    	get actionLink() {
    		return this.$$.ctx.actionLink;
    	}

    	set actionLink(actionLink) {
    		this.$set({ actionLink });
    		flush();
    	}

    	get category() {
    		return this.$$.ctx.category;
    	}

    	set category(category) {
    		this.$set({ category });
    		flush();
    	}
    }

    customElements.define("svelte-lab-card", SvelteLabCard);

    /* src/SvelteLabCardList.svelte generated by Svelte v3.9.1 */

    const file$4 = "src/SvelteLabCardList.svelte";

    function create_fragment$4(ctx) {
    	var div, slot;

    	return {
    		c: function create() {
    			div = element("div");
    			slot = element("slot");
    			this.c = noop;
    			add_location(slot, file$4, 8, 0, 111);
    			attr(div, "class", "card-columns");
    			add_location(div, file$4, 7, 0, 84);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, slot);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    class SvelteLabCardList extends SvelteElement {
    	constructor(options) {
    		super();

    		init(this, { target: this.shadowRoot }, null, create_fragment$4, safe_not_equal, []);

    		if (options) {
    			if (options.target) {
    				insert(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("svelte-lab-card-list", SvelteLabCardList);

    exports.App = App;
    exports.SvelteLab = SvelteLab;
    exports.SvelteLabCard = SvelteLabCard;
    exports.SvelteLabCardList = SvelteLabCardList;
    exports.SvelteLabStep = SvelteLabStep;

    return exports;

}({}));
//# sourceMappingURL=bundle.js.map
