/**
* Modo UI 0.13
* ===========
* (c) 2013 Christian Engel - wearekiss.com
* All rights reserved.
*
* If you are using the Modo library for non-commercial work,
* this Creative Commons license applies:
* http://creativecommons.org/licenses/by-nc-nd/3.0/
*
* Commercial licenses must be obtained directly from Kiss.
* Please contact us by mail at hello@wearekiss.com
*
* @dependencies: jQuery, underscore.js, backbone.js
* @version: 0.13
* @author: Christian Engel <hello@wearekiss.com>
*/
(function (root){
    'use strict';

    var modo,
        modoRollback,
        internals;

    modo = {};

    modoRollback = root.modo;

    modo.VERSION = '0.13';

    /**
     * This is the CSS-Prefix, used by EVERY Modo element you create.
     * @type {String}
     */
    modo.cssPrefix = 'mdo-';

    internals = {
        count: 0,
        domRoot: null,
        /**
         * Will return a new and unique modo element id.
         */
        getId: function (){
            this.count += 1;
            return modo.cssPrefix + this.count;
        }
    };


    /**
     * Use this function to add basic CUI classes to your root app element.
     * Leave the element empty, to use the document body.
     * @param {Object} domTarget The DOM-Node to be used as application container. Optional. If omitted, the BODY tag is used.
     * @param {modo.*} rootElement Any Modo Element to be used as core element.
     */
    modo.init = function (domTarget, rootElement){
        var $domRoot;

        if(rootElement === undefined){
            $domRoot = $('body');
            rootElement = domTarget;
        } else {
            if(domTarget instanceof $){
                $domRoot = domTarget;
            } else {
                $domRoot = $(domTarget);
            }
        }

        $domRoot.addClass(modo.cssPrefix + 'root');
        internals.domRoot = $domRoot;
        if(modo.isElement(rootElement)){
            $domRoot.append(rootElement.el);
        } else {
            throw new Error('Root element no modo element');
        }
        modo.trigger('init');
        return this;
    };

    /**
     * This method defines a new modo element on the modoJS library.
     * @param {String} name
     * @param {Array} classNames
     * @param {Function} Constructor
     * @return Object;
     */
    modo.defineElement = function (name, classNames, Constructor){
        if(typeof this[name] !== 'undefined'){
            throw new Error('Cannot define modo element "' + name + '". Its already defined');
        }

        Constructor.classNames = classNames;

        this[name] = Constructor;

        return {
            /**
             * This method inherits the prototype object of another modo element.
             * @param {String} targetName
             * @param {String} sourceName
             * @return this;
             */
            inheritPrototype: function (){
                var key,
                    protos;

                protos = [];

                for (key = 0; key < arguments.length; key++) {
                    protos.push(modo[arguments[key]].prototype);
                }

                _.extend.apply(window, [Constructor.prototype].concat(protos));

                return this;
            },
            /**
             * Extend the elements prototype with custom methods.
             * @param ext
             * @returns {defineElement}
             */
            extendPrototype: function (ext){
                _.extend(Constructor.prototype, ext);
                return this;
            }
        };
    };

    /**
     * Unsetting the global modoJS object to avoid namespace collisions.
     */
    modo.noConflict = function (){
        root.modo = modoRollback;
    };

    /**
     * Checks if the passed element is a modoJS element.
     * @param {Object} element
     * @return {Boolean}
     */
    modo.isElement = function (element){
        if(typeof element !== 'object'){
            return false;
        }
        return (element.modoId !== undefined && element.el !== undefined);
    };

    /**
     * Checks if the passed element is a get/set enabled modoJS element.
     * @param element
     * @return {Boolean}
     */
    modo.isGetSetElement = function (element){
        if(!this.isElement(element)){
            return false;
        }
        return (typeof element.get === 'function' && typeof element.set === 'function');
    };

    /**
     * Checks if the given element is a DOM node, or a jQuery object.
     * @param element
     * @return {Boolean}
     */
    modo.isDOM = function (element){
        if(typeof element === 'undefined'){
            return false;
        }
        return ((element.nodeName !== undefined) || (element instanceof $));
    };

    /**
     * Returns the root DOM Element, defined in modo.init().
     */
    modo.getRootElement = function (){
        if(internals.domRoot){
            return internals.domRoot;
        }
        return $('body');
    };

    /**
     * This will reset modos state.
     * * sets the object creation counter to zero.
     * * clears the root element
     * * resets the css-prefix to "mdo-"
     * Make sure to remove all previously created modo elements to avoid ID collisions!
     */
    modo.reset = function (){
        internals.count = 0;
        internals.domRoot = null;
        modo.cssPrefix = 'mdo-';
    };

    /**
     * Used by modo.generate().
     * Copies the reference keys over, from nested generate() calls.
     * @param source
     * @param refs
     */
    function copyRefs(source, refs){
        var key;

        for (key in source) {
            if(typeof refs[key] !== 'undefined'){
                throw new Error('Duplicated reference key "' + key + '"');
            }
            refs[key] = source[key];
        }
    }

    /**
     * Used by modo.generate().
     * Used to filter out all non-addable objects before applying an add() to containers.
     * @param o
     * @returns {boolean}
     */
    function filterFunction(o){
        return (typeof o.noAdd === 'undefined');
    }

    /**
     * This will generate a tree of nested Modo elements.
     * Use it to create complex, nested User Interfaces with one function call.
     * @param {Array|Object} struct Your UI definition structure.
     * @return {Object} A object with the Modo elements, you wanted references to.
     */
    modo.generate = function (){
        var struct = arguments[0],
            subcall = arguments[1],
            generated = [],
            refs = {},
            o,
            result,
            mobj,
            i,
            j,
            keyed,
            opt = {silent: true},
            singleObj = false;

        //Enable to pass one definition object directly, instead of encapsulating it in an array.
        if(!(struct instanceof Array)){
            struct = [struct];
            singleObj = true;
        }

        for (i = 0; i < struct.length; i++) {
            o = struct[i];

            if(modo.isElement(o)){
                //Getting a pre-compiled element here - maybe a UI module.
                generated.push(o);
                continue;
            }

            if(o instanceof Object){
                //Check if this is a keyed, pre-compiled element - maybe for a Viewstack.
                result = false;
                for (j in o) {
                    if(o.hasOwnProperty(j)){
                        if(modo.isElement(o[j])){
                            generated.push(o);
                            result = true;
                            break;
                        }
                        break;
                    }
                }
                if(result){
                    continue;
                }
            }

            if(modo[o.type] === undefined){
                throw new Error('Unknown modo element "' + o.type + '"');
            }

            mobj = new modo[o.type](o.params);
            generated.push(mobj);

            //Reference flag - user wants a reference to that element.
            if(o.ref !== undefined){
                if(refs[o.ref] !== undefined){
                    throw new Error('Duplicated reference key "' + o.ref + '"');
                }
                refs[o.ref] = mobj;
            }

            //Flexible flag - has only effect inside a FlexContainer.
            if(o.flexible){
                mobj.setFlexible();
            }

            //Event flag - automatically attach some events.
            if(o.on){
                for (j in o.on) {
                    if(o.on.hasOwnProperty(j)){
                        mobj.on(j, o.on[j]);
                    }
                }
            }

            //One-Time Event flag - automatically attach events that are only responded to, once.
            if(o.once){
                for (j in o.once) {
                    if(o.once.hasOwnProperty(j)){
                        mobj.once(j, o.once[j]);
                    }
                }
            }

            //Hidden flag - for making objects invisible upon creation.
            if(o.hidden){
                mobj.hide();
            }

            //Disabled flag - works on some elements like buttons and will disable them upon creation.
            if(o.disabled){
                if(typeof mobj.disable === 'function'){
                    mobj.disable();
                }
            }

            //Attach children to a container element.
            if(o.children instanceof Array && o.children.length){
                if(typeof mobj.add !== 'function'){
                    throw new Error('Element of type "' + o.type + '" doesn\'t support the addition of children');
                }
                result = modo.generate(o.children, true);
                if(typeof mobj.getElements === 'function'){
                    //Okay, this function exists on elements which want to have keyed elements added.
                    //Lets look for keys.
                    for (j = 0; j < o.children.length; j++) {
                        if(typeof result[0][j].noAdd !== 'undefined'){
                            continue;
                        }
                        if(typeof o.children[j].key !== 'undefined'){
                            keyed = {};
                            keyed[o.children[j].key] = result[0][j];
                            mobj.add.call(mobj, keyed, opt);
                        } else {
                            mobj.add.call(mobj, result[0][j], opt);
                        }
                    }
                } else {
                    result[0].push(opt);
                    mobj.add.apply(mobj, _.filter(result[0], filterFunction));
                }
                copyRefs(result[1], refs);
            }

            //Like the above block, but children are defined in a {key:value} format
            //Thats an easier definition for some container types that require keyed children.
            if(o.children instanceof Object && !(o.children instanceof Array)){
                if(typeof mobj.add !== 'function'){
                    throw new Error('Element of type "' + o.type + '" doesn\'t support the addition of children');
                }

                if(typeof mobj.getElements !== 'function'){
                    throw new Error('Element of type "' + o.type + '" doesn\'t support keyed children.');
                }

                struct = [];
                keyed = [];
                for (j in o.children) {
                    if(o.children.hasOwnProperty(j)){
                        struct.push(o.children[j]);
                        keyed.push(j);
                    }
                }

                result = modo.generate(struct, true);
                for (j = 0; j < keyed.length; j++) {
                    struct = {};
                    struct[keyed[j]] = result[0][j];
                    mobj.add.call(mobj, struct, opt);
                }
                copyRefs(result[1], refs);
            }
        }

        if(subcall){
            return [generated, refs];
        }

        if(singleObj){
            return mobj;
        }

        return refs;
    };

    //=============================================================================

    /**
     * Modo Element
     * ===========
     * This is a basic Modo element, which does not have any enhancements.
     * Basically create any Modo related element based on this object. You can pass in a DOM Element into the params - if not, a DIV is created.
     * @param {Object} params
     * @constructor
     */
    modo.Element = function (params){
        params = params || {};

        var key,
            settings = {
                className: params.className || '',
                dataAttributes: params.dataAttributes || {}
            };

        this.el = params.el || $('<div></div>');

        this.el.addClass(modo.cssPrefix + modo.Element.classNames[0]);

        this.modoId = internals.getId();

        this.visible = true;

        if(settings.className){
            this.el.addClass(settings.className);
        }

        this.el.attr('id', this.modoId);

        for (key in settings.dataAttributes) {
            if(settings.hasOwnProperty(key)){
                this.el.attr('data-' + key, settings.dataAttributes[key]);
            }
        }
    };

    modo.Element.classNames = ['element', 'flexible', 'disabled'];

    _.extend(modo.Element.prototype, Backbone.Events, {

        /**
         * Define whether a container should be flexible inside a flex layout, or not.
         * @param value (optional) default = true
         * @return {modo.*}
         */
        setFlexible: function (value){
            if(typeof value === 'undefined'){
                value = true;
            }

            if(value){
                this.el.addClass(modo.cssPrefix + modo.Element.classNames[1]);
            } else {
                this.el.removeClass(modo.cssPrefix + modo.Element.classNames[1]);
            }
            return this;
        },

        /**
         * This will make the connected DOM element visible.
         * @return {modo.*}
         */
        show: function (options){
            var silent;

            options = options || {};

            silent = options.silent;

            if(this.visible){
                return this;
            }
            this.el.show();
            this.visible = true;
            if(!silent){
                this.trigger('show');
            }
            return this;
        },

        /**
         * This will hide the connected DOM element.
         * @return modo.*
         */
        hide: function (options){
            var silent;

            options = options || {};

            silent = options.silent;

            if(!this.visible){
                return this;
            }
            this.el.hide();
            this.visible = false;
            if(!silent){
                this.trigger('hide');
            }
            return this;
        },

        /**
         * Will add another class name to the DOM element.
         * The class name will be automatically prefixed.
         * @param {String} classname
         * @return {modo.*}
         */
        addClass: function (classname){
            this.el.addClass(modo.cssPrefix + classname);
            return this;
        },

        /**
         * Will remove a class name from the DOM element.
         * The class name will be automatically prefixed
         * @param {String} classname
         * @returns {modo.*}
         */
        removeClass: function (classname){
            this.el.removeClass(modo.cssPrefix + classname);
            return this;
        }
    });

    _.extend(modo, Backbone.Events);

    if(typeof define === 'function' && define.amd){
        define(function (){
            return modo;
        });
    }

    root.modo = modo;
})(this);
/**
 * Modo Button
 * ================
 * This creates a simple button, which is extended by Backbone.Events.
 * It also brings enable() and disable() functions to handle user accessibility.
 * @extends modo.Element
 * @param {Object} params
 * @return {modo.Button}
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('Button', ['button'], function (params){
        params = params || {};

        var settings = {
            label: params.label || '',
            tooltip: params.tooltip || ''
        };

        /**
         * A helper function to return css classnames for this element.
         * @param index
         * @param prefixed
         * @returns {*}
         */
        function cn(index, prefixed){
            if(prefixed){
                return modo.cssPrefix + modo.Button.classNames[index];
            }
            return modo.Button.classNames[index];
        }

        modoCore.Element.call(this, _.extend(params, {el: $('<button title="' + settings.tooltip + '">' + settings.label + '</button>')}));

        this.addClass(cn(0));

        this.disabled = false;

        var that = this;
        this.el.on('click', function (e){
            if(this.disabled){
                return;
            }
            that.trigger('click', e);
        });

        if(params.disabled){
            this.disable({silent: true});
        }
    })
        .inheritPrototype('Element')
        .extendPrototype({
            /**
             * This will enable the button for user interaction.
             */
            enable: function (){
                this.removeClass(modo.Element.classNames[2]);
                this.el.attr('disabled', false);
                this.disabled = false;
                this.trigger('enabled');

                return this;
            },

            /**
             * This will disable the button for user interaction.
             */
            disable: function (){
                this.addClass(modo.Element.classNames[2]);
                this.el.attr('disabled', true);
                this.disabled = true;
                this.trigger('disabled');

                return this;
            }
        });

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.Button;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define(function (){
                return modoCore.Button;
            });
        }
    }
})();
/**
 * Modo Container
 * =============
 * A Modo container can contain child elements.
 * It brings functions for quickly adding/removing other CUI Element based objects.
 * @extends: modo.Element
 * @param {Object} params
 * @return {modo.Container}
 * @constructor
 */
(function () {
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if (typeof modo !== 'undefined') {
        modoCore = modo;
    } else if (typeof require === 'function') {
        modoCore = require('modo');
    }

    modoCore.defineElement('Container', ['container', 'container-layout-'],function (params) {
        params = params || {};

        modoCore.Element.call(this, params);

        var layouts = ['normal', 'inline', 'block'];

        var settings = {
            layout: params.layout || layouts[0]
        };

        if (layouts.indexOf(settings.layout) === -1) {
            settings.layout = layouts[0];
        }

        this.addClass(modoCore.Container.classNames[0]);

        this.addClass(modoCore.Container.classNames[1] + settings.layout);

    })
    .inheritPrototype('Element')
    .extendPrototype({
        /**
         * Will add one or more children to this element.
         */
        add: function () {
            var o,
                i,
                _this = this,
                silent = false,
                events = [];

            for (i = 0; i < arguments.length; i++) {
                o = arguments[i];
                if (modo.isElement(o)) {
                    if (o.modoId === this.modoId) {
                        throw new Error('You can\'t add a container to itself');
                    }
                    _this.el.append(o.el);
                    events.push(o);
                } else {
                    if (modo.isDOM(o)) {
                        this.el.append(o);
                        events.push(o);

                    } else {
                        //Consider to be a option object.
                        if (typeof o === 'undefined') {
                            throw new Error('Illegal object passed');
                        }
                        silent = o.silent;
                    }
                }
            }

            if (!silent) {
                for (i = 0; i < events.length; i++) {
                    this.trigger('add', events[i]);
                }
            }

            return this;
        },

        /**
         * This will remove one, or more children from this element.
         */
        remove: function () {
            var o,
                    i,
                    events = [],
                    silent = false;

            for (i = 0; i < arguments.length; i++) {
                o = arguments[i];
                if (modo.isElement(o)) {
                    $('#' + o.modoId, this.el).remove();
                    events.push(o);
                } else {
                    if (modo.isDOM(o)) {
                        $(o, this.el).remove();
                        events.push(o);
                    } else {
                        silent = o.silent;
                    }
                }
            }

            if (!silent) {
                for (i = 0; i < events.length; i++) {
                    this.trigger('remove', events[i]);
                }
            }

            return this;
        }
    });

    modoCore.Container.INLINE = 'inline';
    modoCore.Container.NORMAL = 'normal';
    modoCore.Container.BLOCK = 'block';

    if (typeof module !== 'undefined') {
        //commonJS modularization
        module.exports = modo.Container;
    } else if (typeof define === 'function') {
        //AMD modularization
        define(function () {
            return modo.Container;
        });
    }
})();
/**
 * Modo FlexContainer
 * ========
 * The Flex Container does align its children either horizontally or vertically.
 * @extends modoCore.Container
 * @param {Object} params
 * @return {modoCore.FlexContainer}
 * @constructor
 */
/* global Modernizr:true */
(function (){
    'use strict';

    var modoCore,
        testEl,
        containers;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    containers = [];

    modoCore.defineElement('FlexContainer', ['flexcontainer', 'flex-', 'flex-fallback', 'flex-js-fallback'], function (params){
        params = params || {};

        modoCore.Container.call(this, params);

        var settings = {
            direction: (params.direction === modoCore.FlexContainer.VERTICAL) ? modoCore.FlexContainer.VERTICAL : modoCore.FlexContainer.HORIZONTAL
        };

        this.addClass(modoCore.FlexContainer.classNames[0]);
        this.addClass(modoCore.FlexContainer.classNames[1] + settings.direction);

        if(modoCore.FlexContainer.fallback){
            this.addClass(modoCore.FlexContainer.classNames[2]);
        }
        if(modoCore.FlexContainer.jsFallback){
            this.addClass(modoCore.FlexContainer.classNames[3]);
        }

        /**
         * Changes the flex direction of the element.
         * @param d
         * @return {*}
         */
        this.direction = function (d){
            if(d !== modoCore.FlexContainer.HORIZONTAL && d !== modoCore.FlexContainer.VERTICAL){
                throw new Error('Illegal direction value');
            }

            this.removeClass(modoCore.FlexContainer.classNames[1] + settings.direction);
            settings.direction = d;
            this.addClass(modoCore.FlexContainer.classNames[1] + settings.direction);
            return this;
        };

        /**
         * Call this to re-calculate the children dimensions.
         * Only necessary
         */
        this.update = function (){
            var flexClass,
                fixedElements,
                flexibleElements,
                consumed,
                flexSize;

            //mdo-flexible
            flexClass = modoCore.cssPrefix + modoCore.Element.classNames[1];

            fixedElements = [];
            flexibleElements = [];
            consumed = 0;

            _.each(this.el.children(), function (el){
                var $el;
                $el = $(el);

                if($el.hasClass(flexClass)){
                    flexibleElements.push($el);
                    return;
                }
                fixedElements.push($el);
                if(settings.direction === modoCore.FlexContainer.VERTICAL){
                    consumed += $el.outerHeight();
                    return;
                }
                consumed += $el.outerWidth();
            });

            if(settings.direction === modoCore.FlexContainer.VERTICAL){
                flexSize = (this.el.height() - consumed) / flexibleElements.length;
            } else {
                flexSize = (this.el.width() - consumed) / flexibleElements.length;
            }

            _.each(flexibleElements, function (el){
                var set;

                if(settings.direction === modoCore.FlexContainer.VERTICAL){
                    set = {
                        height: flexSize,
                        width: '100%'
                    };
                } else {
                    set = {
                        height: '100%',
                        width: flexSize
                    };
                }
                $(el).css(set);
            });
        };

        containers.push(this);

        if(modoCore.FlexContainer.jsFallback){
            this.update();
        }
    })
        .inheritPrototype('Container')
        .extendPrototype({});

    modoCore.FlexContainer.HORIZONTAL = 'horizontal';
    modoCore.FlexContainer.VERTICAL = 'vertical';

    //==================================================================================================================

    /**
     * Call this function to update all FlexContainer elements in the application.
     */
    modoCore.FlexContainer.updateAll = function (){
        _.each(containers, function (el){
            el.update();
        });
    };

    modoCore.FlexContainer.jsFallback = false;
    modoCore.FlexContainer.fallback = false;

    //Test, if the current browser supports the recent flexbox spec.
    //If not, add the fallback class to the root element to get flex items rendered with the 2009 spec.
    if(typeof Modernizr !== 'undefined'){
        modoCore.FlexContainer.fallback = !Modernizr.flexbox;
    } else {
        //Sadly, no Modernizr present. Lets make a quick, harsh test.
        testEl = document.createElement('div');

        if(typeof testEl.style.msFlexBasis === 'undefined' && typeof testEl.style.webkitFlexBasis === 'undefined' && typeof testEl.style.mozFlexBasis === 'undefined' && typeof testEl.style.flexBasis === 'undefined'){
            modoCore.FlexContainer.fallback = true;
        }
    }

    if(modoCore.FlexContainer.fallback){
        //We have to test if we need to use the JS fallback, in case of IE, or other oldies!
        testEl = document.createElement('div');
        if(typeof testEl.style.MozBoxFlex === 'undefined' && typeof testEl.style.WebkitBoxFlex === 'undefined' && typeof testEl.style.BoxFlex === 'undefined'){
            modoCore.FlexContainer.jsFallback = true;

            $(window).on('resize', modoCore.FlexContainer.updateAll);

            modoCore.on('init', function (){
                modoCore.FlexContainer.updateAll();
            });
        }
    }
})();
/**
 * Modo Input Text
 * ==============
 * The text input control can be used for different occasions.
 * Use the type parameter to tweak it to any kind of input you need (eg. search, mail, ...).
 * Tip: it provides easy event-names for different keyboard events, like "keydown:enter".
 * @param params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('InputText', ['inputtext', 'inputtext-'], function (params){
        params = params || {};

        var settings,
            that,
            keymap,
            lazyFocus;


        settings = {
            type: params.type || 'text',
            placeholder: params.placeholder || '',
            changeThreshold: (params.changeThreshold !== undefined) ? parseInt(params.changeThreshold, 10) : 500,
            timeout: null,
            lastValue: null,
            value: params.value || '',
            boundModel: null,
            boundModelKey: null
        };

        modoCore.Element.call(this, _.extend(params, {el: $('<input type="' + settings.type + '">')}));

        this.addClass(modoCore.InputText.classNames[0]);
        this.addClass(modoCore.InputText.classNames[1] + settings.type);

        that = this;

        keymap = {
            13: 'enter',
            27: 'escape',
            18: 'alt',
            17: 'ctrl',
            16: 'shift',
            38: 'up',
            40: 'down',
            37: 'left',
            39: 'right',
            8: 'backspace',
            46: 'del',
            35: 'end',
            36: 'pos1',
            45: 'paste',
            9: 'tab'
        };

        //If you want to select text after a "focus" event,
        //it will fail when the user clicks in the textfield.
        //A click seems to set a focus (at least in chrome).
        //So this debounced function will cause the elements
        //"focus" event to be triggered AFTER the click event.
        //Crazy stuff.
        lazyFocus = _.debounce(function (){
            that.trigger('focus');
        }, 100);

        this.el.on('keydown',function (e){
            that.trigger('keydown', e);
            that.trigger('keydown:' + e.keyCode, e);
            if(typeof keymap[e.keyCode] !== 'undefined'){
                that.trigger('keydown:' + keymap[e.keyCode], e);
            }

            if(settings.timeout){
                clearTimeout(settings.timeout);
            }
            settings.timeout = setTimeout(function (){
                settings.value = that.el.val();
                if(settings.lastValue !== settings.value){
                    settings.lastValue = settings.value;
                    if(settings.boundModel && settings.boundModelKey){
                        settings.boundModel.set(settings.boundModelKey, settings.value);
                    }
                    that.trigger('change', that.el.val());
                }
            }, settings.changeThreshold);

        }).on('blur',function (){
                that.trigger('blur');
            }).on('focus',function (){
                lazyFocus();
            }).on('click', function (){
                lazyFocus();
            });

        if(settings.placeholder){
            this.el.attr('placeholder', settings.placeholder);
        }

        if(settings.value){
            this.el.val(settings.value);
            settings.lastValue = settings.value;
        }

        this.set = function (value, options){
            var silent;

            options = options || {};

            silent = options.silent;

            settings.value = value;
            this.el.val(value);
            if(settings.value !== settings.lastValue){
                settings.lastValue = value;
                if(!silent){
                    this.trigger('change', value);
                }
            }

            return this;
        };

        /**
         * Binds the element to a Backbone Model.
         * Prevous bindings will be detached.
         * Heads up: Two-way binding is only possible when giving a modelKey!
         * @param {Backbone.Model} model
         * @param {string} [modelKey=null] If not given, give a processing function!
         * @param {function} [processingFunction] A function that takes `model` as a argument and returns value on every change event.
         */
        this.bindToModel = function (model, modelKey, processingFunction, noUpdate){
            if(!(model instanceof Backbone.Model)){
                throw new Error('Can only bind to a backbone model.');
            }

            if(settings.boundModel){
                this.stopListening(settings.boundModel);
            }

            settings.boundModel = model;
            settings.boundModelKey = modelKey;

            if(!modelKey){
                if(typeof processingFunction === 'function'){
                    this.listenTo(model, 'change', function (){
                        that.set(processingFunction.call(that, model));
                    });
                    settings.value = processingFunction(params.model);
                } else {
                    throw new Error('Trying to bind to model, but no modelKey and no processingFunction given');
                }
            } else {
                settings.value = model.get(modelKey);

                this.listenTo(model, 'change:' + modelKey, function (){
                    that.set(model.get(modelKey));
                });
            }

            if(!noUpdate){
                this.set(settings.value);
            }
        };

        if(params.model){
            this.bindToModel(params.model, params.modelKey, (typeof params.value === 'function') ? params.value : null, true);
        }

        if(params.disabled){
            this.disable();
        }
    })
        .inheritPrototype('Element')
        .extendPrototype({
            /**
             * If no value given, the current value will be returned.
             * If a value is passed, the current value will be overwritten.
             * @param {String} value
             * @returns {String}
             */
            get: function (){
                return this.el.val();
            },

            /**
             * Will take the keyboard focus from the elements DOM object.
             */
            blur: function (){
                this.el.blur();
                this.trigger('blur');
                return this;
            },

            /**
             * Will set the keyboard focus to the elements DOM object.
             */
            focus: function (){
                this.el.focus();
                this.trigger('focus');
                return this;
            },

            /**
             * Select a part of the input text.
             * @param {Integer} start Beginning of the selection in characters from left
             * @param {Integer} length Length of the selection, or characters from left if values is negative
             */
            select: function (start, length){
                var value = this.el.val();

                if(start === void 0 && length === void 0){
                    this.el[0].select();
                    return this;
                }

                if(length === void 0){
                    length = 0;
                }

                if(!start){
                    start = 0;
                }

                if(length < 0){
                    length += value.length;
                } else {
                    length += start;
                }

                this.el[0].setSelectionRange(start, length);

                return this;
            },

            disable: function (){
                this.el.attr('disabled', true).addClass(modoCore.cssPrefix + 'disabled');
                this.trigger('disable');
                return this;
            },

            enable: function (){
                this.el.attr('disabled', false).removeClass(modoCore.cssPrefix + 'disabled');
                this.trigger('enable');
                return this;
            }
        });


    modoCore.InputText.SEARCH = 'search';


    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.InputText;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define(function (){
                return modoCore.InputText;
            });
        }
    }
})();
/**
 * modo-Label
 * ===========
 * A label is the most basic of all get/set enabled elements.
 * You can use it to display some (html)text.
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    function cn(index, prefixed){
        if(prefixed !== undefined){
            return modoCore.Label.classNames[index];
        }
        return modoCore.cssPrefix + modoCore.Label.classNames[index];
    }

    modoCore.defineElement('Label', ['label'], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        this.addClass(cn(0, true));

        var that = this;

        if(params.model){
            if(!params.modelKey){
                if(typeof params.value === 'function'){
                    params.model.on('change', function (){
                        that.set(params.value.call(that, params.model));
                    });
                } else {
                    throw new Error('Trying to bind to model, but no modelKey and no valueFunction given');
                }
            } else {
                params.value = params.model.get(params.modelKey);

                params.model.on('change:' + params.modelKey, function (){
                    that.set(params.model.get(params.modelKey));
                });
            }
        }

        this.el.html(typeof params.value !== 'function' ? params.value || '' : '');

    })
        .inheritPrototype('Element')
        .extendPrototype({
            set: function (value, options){
                var silent;

                options = options || {silent: false};

                silent = options.silent;

                this.el.html(value);
                if(!silent){
                    this.trigger('change', value);
                }
                return this;
            },
            get: function (){
                return this.el.html();
            }
        });

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modo.Label;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('Label', [], function (){
                return modo.Label;
            });
        }
    }
})();
/**
 * Modo List
 * ========
 * A Modo List generates lists from data sets.
 * It can be either used by passing an array of objects as the data parameter, or a Backbone.Collection.
 * The data_renderer function is used to create the single list items html code.
 * The collector function (optional) is used to break down/filter the data set from the collection if you don't want to use the full collection.
 * updateOn holds an array of event names emitted by the Backbone.Collection on which you want to automatically re-draw the list.
 * itemEvents attaches listeners to the item elements itself, or their sub-elements.
 * @extends modo.Container
 * @param {Object} params
 * @constructor
 */
/* jshint loopfunc:true */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    /*var params = {
     data: Backbone.Collection,
     collector: function(collection){ return collection.filter(function(){return true;}) },
     updateOn: ['add', 'change', 'remove', 'sort'],
     itemRender: function(data){ return html; },
     itemEvents: {
     "click": function(e){},
     "click .element": function(e){}
     }
     };*/
    modoCore.defineElement('List', ['list', 'list-item', 'list-empty-element'], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        this.addClass(modoCore.List.classNames[0]);

        var settings = {
            data: params.data,
            collector: params.collector || function (c){
                return c.filter(function (){
                    return true;
                });
            },
            updateOn: params.updateOn || ['add', 'change', 'remove', 'sort', 'reset'],
            itemRender: params.itemRender || function (d){
                if(!d){
                    return;
                }
                if(typeof d === 'string'){
                    return '<div>' + d + '</div>';
                }
                for (var key in d) {
                    if(key === '_m'){
                        continue;
                    }
                    break;
                }
                return '<div>' + d[key].toString() + '</div>';
            },
            itemEvents: params.itemEvents || {},
            emptyRender: params.emptyRender || function (){
                return '';
            }
        };

        //All contains a jQuery element list of all list elements.
        //This is used to get the index of a clicked element and fetching its Backbone model (when possible).
        var all;

        //This contains the Backbone Model IDs (cids) of all models in the order they are rendered.
        var ids;

        var _this = this;

        var listItemClass = modoCore.cssPrefix + modoCore.List.classNames[1];

        /**
         * Provides access to the number of elements being rendered by the list.
         * @type {Number}
         */
        this.length = 0;

        /**
         * Will update the rendered output.
         */
        this.update = function (options){
            var html = '',
                dataset,
                modelMode = false,
                arrayMode = false,
                key,
                silent,
                i,
                result,
                modoElements = [];

            options = options || {};

            silent = options.silent;

            dataset = [];
            ids = [];
            if(typeof params.data === 'function'){
                settings.data = params.data();
            }
            if(settings.data instanceof Backbone.Collection){
                modelMode = true;
                dataset = settings.collector(settings.data);
                _.each(dataset, function (e){
                    ids.push(e.id || e.cid);
                });
            } else {
                if(settings.data instanceof Array){
                    arrayMode = true;
                }
                for (key in settings.data) {
                    if(!arrayMode){
                        ids.push(key);
                    }
                    dataset.push(settings.data[key]);
                }
            }

            if(dataset.length){
                for (i = 0; i < dataset.length; i++) {
                    if(modelMode){
                        result = settings.itemRender.call(this, _.extend(dataset[i].toJSON(), {_m: dataset[i] }), i);
                    } else {
                        result = settings.itemRender.call(this, dataset[i], i, (!arrayMode) ? ids[i] : undefined);
                    }
                    if(modoCore.isElement(result)){
                        modoElements.push([result, i]);
                        html += '<div></div>';
                    } else {
                        html += result;
                    }
                }
            } else {
                html += settings.emptyRender();
            }

            this.length = dataset.length;

            this.el.html(html);

            all = this.el.children('*');
            all.addClass(listItemClass);
            if(!dataset.length){
                this.el.children(':first').addClass(modoCore.cssPrefix + modoCore.List.classNames[2]);
            }

            /**
             * Insert generated Modo Elements into the list.
             */
            all = this.el.find('.' + modoCore.cssPrefix + modoCore.List.classNames[1]);
            for (i = 0; i < modoElements.length; i++) {
                all.eq(modoElements[i][1]).append(modoElements[i][0].el);
            }

            if(!silent){
                this.trigger('update');
            }

            return this;
        };

        /**
         * This returns the DOM element for a specific data key.
         * @param {*} key The data-key of the DOM element you want to fetch.
         * @return jQuery
         */
        this.getItemByKey = function (key){
            var index;

            if(settings.data instanceof Array){
                if(typeof key !== 'number'){
                    throw new Error('You can only pass numeric keys to select items from arrays');
                }
                index = key;
            } else {
                index = ids.indexOf(key);
                if(index === -1){
                    throw new Error('Element key not in dataset');
                }
            }

            return this.el.find('.' + modoCore.cssPrefix + modoCore.List.classNames[1]).eq(index);
        };

        /**
         * This returns the lists filtered dataset in the same format as Backbones getJSON() function.
         * @param {Integer} [limit] Set this to limit the amount of returned entries.
         */
        this.get = function (limit){
            var dataset,
                jsonFormatted = [],
                i;

            if(settings.data instanceof Backbone.Collection){
                dataset = settings.collector(settings.data);
                for (i = 0; i < dataset.length; i++) {
                    jsonFormatted.push(dataset[i].toJSON());
                    if(limit){
                        if(jsonFormatted.length === limit){
                            return jsonFormatted;
                        }
                    }
                }
                return jsonFormatted;
            } else {
                if(!limit){
                    return settings.data;
                }
                return settings.data.slice(0, limit);
            }
        };

        /**
         * This replaces the current dataset of the element and triggers a update.
         * @return this
         */
        this.set = function (dataset, options){
            settings.data = dataset;

            this.stopListening();
            if(settings.data instanceof Backbone.Collection){
                _this.listenTo(settings.data, settings.updateOn.join(' '), function (){
                    _this.update();
                });
            }

            this.update(options);

            return this;
        };

        if(settings.data instanceof Backbone.Collection){
            _this.listenTo(settings.data, settings.updateOn.join(' '), function (){
                _this.update();
            });
        }

        for (var evt in settings.itemEvents) {
            var chain = evt.split(' ');
            this.el.on(chain.shift(), '.' + listItemClass + ' ' + chain.join(' '), (function (evt){
                return function (e){
                    var $this = $(this),
                        listElement,
                        clickedIndex,
                        index = 0,
                        data;

                    //Don't capture events on empty list placeholders.
                    if($this.hasClass(modoCore.cssPrefix + modoCore.List.classNames[2])){
                        return;
                    }

                    if($this.hasClass(listItemClass)){
                        listElement = $this;
                    } else {
                        listElement = $this.parents('.' + listItemClass);
                    }

                    clickedIndex = -1;
                    $.each(all, function (){
                        if($(this).is(listElement)){
                            clickedIndex = index;
                            return false;
                        }
                        index++;
                    });

                    if(settings.data instanceof Backbone.Collection){
                        index = ids[clickedIndex];
                        data = settings.data.get(ids[clickedIndex]);
                    } else {
                        if(settings.data instanceof Array){
                            index = clickedIndex;
                            data = settings.data[clickedIndex];
                        } else {
                            index = ids[clickedIndex];
                            data = settings.data[ids[clickedIndex]];
                        }
                    }
                    if(typeof settings.itemEvents[evt] === 'function'){
                        settings.itemEvents[evt].call(this, e, index, data, _this);
                    } else {
                        _this.trigger('item:' + settings.itemEvents[evt], e, index, data);
                    }
                };
            })(evt));
        }

        if(params.data !== void 0){
            this.update();
        }
    })
    .inheritPrototype('Element');
})();
/**
 * Modo Toggle Button
 * =================
 * This is a normal Modo button with extra functionality - it can be toggled by click, or manually (with the set() function).
 * @extends {modo.Button}
 * @param {Object} params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('ToggleButton', ['togglebutton', 'toggled'], function (params){
        params = params || {};

        modo.Button.call(this, params);

        this.addClass(modo.ToggleButton.classNames[0]);

        this.toggled = false;

        this.locked = false;

        this.on('click', function (){
            if(this.locked){
                return;
            }
            if(this.get()){
                this.set(false);
            } else {
                this.set(true);
            }
        });
    })
        .inheritPrototype('Button')
        .extendPrototype({
            /**
             * Will set the buttons toggle state to toggled or not toggled.
             * @param truefalse (optional) If not given, the current state will be inverted.
             */
            set: function (truefalse){
                if(typeof truefalse === 'undefined'){
                    truefalse = !this.toggled;
                }
                if(truefalse){
                    truefalse = true;
                } else {
                    truefalse = false;
                }

                this.toggled = truefalse;

                if(this.toggled){
                    this.addClass(modo.ToggleButton.classNames[1]);
                    this.trigger('change', true);
                } else {
                    this.removeClass(modo.ToggleButton.classNames[1]);
                    this.trigger('change', false);
                }

                return this;
            },

            get: function (){
                return this.toggled;
            },

            /**
             * Call this function to lock the button against user interactions.
             * It won't be rendered as disabled, but it can't be toggled by user interaction anymore. Click events are fired, tough.
             */
            lock: function (truefalse){
                if(typeof truefalse === 'undefined'){
                    truefalse = true;
                }
                if(truefalse){
                    this.locked = true;
                } else {
                    this.locked = false;
                }

                return this;
            }
        });


    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modo.ToggleButton;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('ToggleButton', [], function (){
                return modo.ToggleButton;
            });
        }
    }
})();
/**
 * Modo Toggle Group
 * ================
 * The Toggle Group is a special type of container which can only contain elements of type modo.ToggleButton.
 * There can only be one toggled Button in a Toggle Group. If you toggle another (by script or user-interaction),
 * the previously toggled button gets un-toggled.
 * @extends: modo.Container
 * @param params
 * @return {modo.ToggleGroup}
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('ToggleGroup', ['togglegroup'], function (params){
        params = params || {};

        params.layout = modo.Container.INLINE;

        modo.Container.call(this, params);

        this.removeClass(modo.Container.classNames[0]).addClass(modo.ToggleGroup.classNames[0]);

        this.elements = {};

        //Keep the parents add and remove functions.
        var pAdd = modo.ToggleGroup.prototype.add;
        var pRemove = modo.ToggleGroup.prototype.remove;

        var _this = this;

        var selectedKey;

        function toggleListener(){
            //Note: "this" is the togglebutton that has been clicked.
            /*jshint validthis:true */
            if(this.toggled){
                return;
            }

            for (var key in _this.elements) {
                if(_this.elements[key].modoId === this.modoId){
                    selectedKey = key;
                }
                if(_this.elements[key].toggled){
                    _this.elements[key].set(false);
                }
            }

            this.set(true);
            _this.trigger('change', selectedKey);
        }

        /**
         * This will add one or more new buttons to the end of the toggle group.
         * Just pass a key/value object, or a object of type modo.ToggleButton there.
         * @param elements
         */
        this.add = function (elements, options){
            var e,
                silent;

            options = options || {};

            silent = options.silent;

            for (var key in elements) {
                e = elements[key];

                if(modo.isElement(e)){
                    if(!e instanceof modo.ToggleButton){
                        throw new Error('Only Modo elements of type ToggleButton can be added to a ToggleGroup.');
                    } else {
                        e.lock();
                        this.elements[key] = e;
                        e.on('click', toggleListener);
                        pAdd.call(this, e, options);
                        if(typeof selectedKey === 'undefined'){
                            this.set(key);
                        }
                        if(!silent){
                            this.trigger('add', e);
                        }
                        continue;
                    }
                }

                if(typeof elements[key] !== 'string'){
                    throw new Error('Please pass key/value pairs with string values to this element.');
                }
                this.elements[key] = new modo.ToggleButton({
                    label: elements[key]
                });
                this.elements[key].lock();
                this.elements[key].on('click', toggleListener);
                if(typeof selectedKey === 'undefined'){
                    this.set(key);
                }
                pAdd.call(this, this.elements[key], options);
                if(!silent){
                    this.trigger('add', this.elements[key]);
                }
            }
        };

        /**
         * Pass either a key (string), or an array of keys to remove.
         * @param elements
         */
        this.remove = function (elements, options){
            options = options || {};

            if(typeof elements === 'string'){
                if(typeof this.elements[elements] !== 'undefined'){
                    pRemove.call(this, this.elements[elements], options);
                    this.elements[elements].off('click', toggleListener);
                    delete this.elements[elements];
                    if(!options.silent){
                        this.trigger('remove', elements);
                    }
                }
            } else {
                pRemove.call(this, elements, options);
            }
        };

        /**
         * Toggle the button with the given key programmatically.
         * @param {String} key
         * @param {object} options
         * @param {boolean} options.silent Prevent any event triggering.
         * @returns this
         */
        this.set = function (key, options){
            var silent;

            options = options || {};

            silent = options.silent;

            if(typeof this.elements[key] === 'undefined'){
                throw new Error('Object not in this group');
            }

            if(this.elements[key].get()){
                return this;
            }

            for (var inKey in this.elements) {
                this.elements[inKey].set((inKey === key));
            }

            selectedKey = key;

            if(!silent){
                this.trigger('change', key);
            }
            return this;
        };

        /**
         * Returns the key of the currently toggled button.
         * @returns {*}
         */
        this.get = function (){
            return selectedKey;
        };

        /**
         * Returns the object that contains references to all contained elements.
         * @returns object
         */
        this.getElements = function (){
            return this.elements;
        };

        if(params.elements !== undefined){
            this.add(params.elements);
        }

        if(params.selectedItem !== undefined){
            this.set(params.selectedItem);
        }


        function fetchCollection(){
            params.elements = {};
            _this.el.html('');
            var key, m, dta = {};

            for (key in params.collection.models) {
                m = params.collection.models[key];
                dta[(m.id || m.cid)] = m.get(params.pluck);
            }

            _this.add(dta);
            if(selectedKey){
                _this.set(selectedKey, {silent: true});
            }
        }


        if(params.collection !== undefined){

            fetchCollection();

            params.collection.on(params.updateOn ? params.updateOn.join(' ') : 'add change remove sort', function (){
                fetchCollection();
            });
        }
    })
    .inheritPrototype('Container');

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.ToggleGroup;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define(function (){
                return modoCore.ToggleGroup;
            });
        }
    }
})();
/**
 * modo-Viewstack
 * ===========
 * description
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    function cn(index, prefixed){
        if(prefixed !== undefined){
            return modoCore.ViewStack.classNames[index];
        }
        return modoCore.cssPrefix + modoCore.ViewStack.classNames[index];
    }

    modoCore.defineElement('ViewStack', ['viewstack'], function (params){
        params = params || {};

        modoCore.Container.call(this, params);

        var pAdd,
            pRemove;

        this.addClass(cn(0, true));

        pAdd = modoCore.ViewStack.prototype.add;
        pRemove = modoCore.ViewStack.prototype.remove;

        this.elements = {};
        this.count = 0;
        this.displaying = 0;
        this.switchMethod = params.switchMethod;

        /**
         * The behaviour of this add() function is different to the behaviour of the modoCore.Container's add() function.
         * You have to add a key/value object here, where the value is a CUI element.
         * Example:
         * {
                 *   "test": new modoCore.Button()
                 * }
         *
         * So you can show this element by calling display('test');
         * @param object
         */
        this.add = function (object, options){
            var key,
                silent;

            if(modoCore.isElement(object) || modoCore.isDOM(object)){
                throw new Error('Do not pass modoCore.* or DOM elements here, directly');
            }

            options = options || {};

            silent = options.silent;

            for (key in object) {
                this.elements[key] = object[key];

                this.count++;
                if(this.count === 1){
                    object[key].show();
                    this.displaying = key;
                    this.trigger('display', key);
                } else {
                    object[key].hide();
                }

                pAdd.call(this, object[key], {silent: true});
                var eobj = {};
                eobj[key] = object[key];
                if(!silent){
                    this.trigger('add', eobj);
                }
            }
        };

        /**
         * Pass in a key, to remove the specified object from the viewStack.
         * @param {String} key
         */
        this.remove = function (key, options){
            var eobj,
                inKey,
                silent;

            options = options || {};

            silent = options.silent;

            if(typeof this.elements[key] === 'undefined'){
                throw new Error('Object not part of this Container');
            }
            pRemove.call(this, this.elements[key], {silent: true});
            eobj = {};
            eobj[key] = this.elements[key];
            delete this.elements[key];
            this.count--;
            if(!silent){
                this.trigger('remove', eobj);
            }

            if(this.displaying === key){
                this.displaying = null;
                if(!this.count){
                    return;
                }
                for (inKey in eobj.elements) {
                    this.display(inKey);
                    return;
                }
            }
        };

        this.getElements = function (){
            return this.elements;
        };

    })
        .inheritPrototype('Container')
        .extendPrototype({
            /**
             * This will show the specified element and hide all others.
             * @param {String} key
             */
            set: function (key){
                var showElement,
                    hideElement,
                    inKey;

                if(typeof this.elements[key] === 'undefined'){
                    throw new Error('Object not part of this Container');
                }

                showElement = this.getElementByKey(key);
                if(this.displaying){
                    hideElement = this.getElementByKey(this.displaying);
                }

                if(typeof this.switchMethod === 'function'){
                    this.switchMethod(hideElement, showElement);
                } else {
                    if(hideElement){
                        hideElement.hide();
                    }
                    showElement.show();
                }

                this.displaying = key;
                this.trigger('display', key);
            },

            get: function(){
                return this.displaying;
            },

            /**
             * Returns the Element with the given key.
             * @param key
             * @returns {*}
             */
            getElementByKey: function(key){
                if(this.elements[key] === undefined){
                    throw new Error('Element does not exist');
                }
                return this.elements[key];
            }
        });

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.ViewStack;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('ViewStack', [], function (){
                return modoCore.ViewStack;
            });
        }
    }
})();
/**
 * Modo PopUp
 * =========
 * A PopUp Element can be used to display content on top of any other content in the application.
 * Its easy to emulate "windows" or dialogs in your application with the PopUp Element.
 *
 * A Modo PopUp can be placed anywhere on the screen - it don't has to be added to a specific container or element.
 *
 * You can display a Modo PopUp either in normal, or modal mode (this displays a mask that blocks access to underlying elements).
 * @param params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    /**
     * "Global" object shared between all popups. Needed to manage z-index depth and sharing of the modal mask.
     * @type {Object}
     */
    var internal = {
        modal: [],
        nonModal: [],
        mask: null,
        zIndex: 0,
        maskOwnerStack: [],
        maskOwner: null,
        showMask: function (modal, settings){
            if(internal.mask === null){
                internal.mask = $('<div></div>').hide();
                internal.mask.addClass(modoCore.cssPrefix + modoCore.PopUp.classNames[1]);
                if(settings.className){
                    internal.mask.addClass(settings.className + '-mask');
                }
                modoCore.getRootElement().append(internal.mask);
                internal.mask.on('click', function (e){
                    e.preventDefault();
                    e.stopPropagation();
                    if(internal.maskOwner === null){
                        return;
                    }
                    if(internal.maskOwner[1].closeOnBackdrop){
                        internal.maskOwner[0].close();
                    }
                });
            }

            if(internal.maskOwner !== null){
                internal.maskOwnerStack.push(internal.maskOwner);
            }
            internal.mask[0].style.zIndex = modal.el[0].style.zIndex - 1;
            internal.mask.fadeIn();
            internal.maskOwner = [modal, settings];
        },
        hideMask: function (){
            internal.maskOwner = null;
            if(internal.maskOwnerStack.length){
                internal.maskOwner = internal.maskOwnerStack.pop();
                internal.mask[0].style.zIndex = internal.maskOwner[0].el[0].style.zIndex - 1;
            } else {
                internal.mask.fadeOut();
            }
        },
        getDepth: function (){
            internal.zIndex += 2;
            return 9000 + internal.zIndex - 2;
        }
    };

    modoCore.once('init', function (){
        modoCore.getRootElement().on('keydown', function (e){
            if(e.keyCode !== 27){
                return;
            }
            if(internal.maskOwner === null){
                return;
            }
            if(internal.maskOwner[1].keyboard){
                internal.maskOwner[0].close();
            }
        });
    });

    modoCore.defineElement('PopUp', ['popup', 'popup-mask'],function (params){
        params = params || {};

        modoCore.Container.call(this, params);

        this.classNames = modoCore.PopUp.classNames;

        this.addClass(this.classNames[0]);

        /**
         * Used as a marker for the modoCore.generate() function.
         * This states, that this element must not be passed to add() functions.
         * @type {Boolean}
         */
        this.noAdd = true;

        var _this = this;

        var settings = {
            className: params.className, //Stored to be accessable for the mask element
            modal: params.modal || false,
            keyboard: params.keyboard || true,
            closeOnBackdrop: (typeof params.closeOnBackdrop !== 'undefined') ? params.closeOnBackdrop : true,
            attached: false,
            visible: false,
            animate: params.animate || false,
            showEffect: params.showEffect || null,
            hideEffect: params.hideEffect || null
        };

        this.el.hide();

        this.open = function (){
            if(this.isOpen()){
                return;
            }

            if(!settings.attached){
                modoCore.getRootElement().append(this.el);
            }
            if(!settings.animate){
                this.el.show();
            } else {
                if(params.showEffect){
                    params.showEffect(this.el);
                } else {
                    this.el.fadeIn('slow');
                }
            }
            this.el[0].style.zIndex = internal.getDepth();
            settings.visible = true;
            if(settings.modal){
                internal.showMask(this, settings);
            }
            this.trigger('open');

            return this;
        };

        this.close = function (){
            if(!this.isOpen()){
                return;
            }

            if(!settings.animate){
                this.el.hide();
            } else {
                if(params.hideEffect){
                    params.hideEffect(this.el);
                } else {
                    this.el.fadeOut('slow');
                }
            }
            settings.visible = false;
            if(settings.modal){
                internal.hideMask();
            }
            this.trigger('close');

            return this;
        };

        this.move = function (x, y){
            if(y === undefined && typeof x === 'object'){
                y = x.y;
                x = x.x;
            }

            _this.el.css({
                top: y,
                left: x
            });

            _this.trigger('move', x, y);

            return this;
        };

        this.isOpen = function (){
            return settings.visible;
        };

        if(typeof params.x !== 'undefined'){
            this.el.css('left', params.x);
        }
        if(typeof params.y !== 'undefined'){
            this.el.css('top', params.y);
        }
    }).inheritPrototype('Container');

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.PopUp;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('PopUp', [], function (){
                return modoCore.PopUp;
            });
        }
    }
})();
/**
 * Modo FormContainer
 * =================
 * Use this container to create edit forms for your data.
 * You can add different editing controls to it (eg. Textfields, ToggleButtons, Dropdowns...) and assign each
 * control to a specific value of a object or Backbone Model.
 * When you pass a object or Backbone Model to the FormContainer, each value is provided to the connected editing control.
 * You can call one method of the FormContainer to retrieve all data from all attached controls assigned back to the original object/model structure.
 * @param params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('FormContainer', ['formcontainer'], function (params){
        params = params || {};

        modoCore.Container.call(this, params);


        this.addClass(modoCore.FormContainer.classNames[0]);

        //Keep the original add/remove functions.
        var pAdd = modoCore.FormContainer.prototype.add; //,
        //pRemove = modoCore.FormContainer.prototype.remove;

        var that = this;

        var settings = {
            elements: {},
            autosave: params.autosave || true,
            autosync: params.autosync,
            data: null,
            preparedData: null,
            csrf: params.csrf || null,
            /**
             * Prepare functions are used to convert data from the data source to the specified element.
             * Example:
             * function(dataValue){
                 *  return convertedValue;
                 * }
             * @type {Object}
             */
            prepare: params.prepare || function (d){
                return d;
            },
            /**
             * Clean Functions are used to convert data from the specified element to the data source.
             * Example:
             * function(elementValue){
                 *   return convertedValue;
                 * }
             * Note: If the function returns no value, then nothing will be assigned to the data source (original will be kept).
             * @type {Object}
             */
            clean: params.clean || function (d){
                return d;
            },
            /**
             * This function is called, AFTER all prepare functions for the specified elements have been run.
             * The complete prepared dataset can be manipulated and extended before its finally distributed to the single elements.
             * May be necessary to feed multiple multiple control elements from one data value.
             * @type {Function}
             * @returns {Object}
             */
            finalPrepare: params.finalPrepare || function (d){
                return d;
            },
            /**
             * This function is called, AFTER all clean functions for the data source have been run.
             * The complete prepared data set can be manipulated, before its copied to the originally passed object / Backbone Model.
             * May be necessary to set one data value from multiple control elements, or remove temporary data fields.
             * @type {Function}
             * @returns {Object}
             */
            finalClean: params.finalClean || function (d){
                return d;
            },
            changeNotifier: function (/*elm, v*/){
                that.dirty = true;
                if(settings.autosave){
                    that.save();
                }
            }
        };

        /**
         * The blank data object will be used as form data when the set() function is called with no data.
         * Useful for setting default values for new data objects.
         * @type {Object}
         */
        this.defaultData = params.defaultData || {};

        /**
         * This flag will be set to true when one of the contained, keyed set/get enabled elements fire a change event.
         * It will be set back to false, after a set() or save() call.
         * ___Note:___ This will never switch to false in a autosave enabled FormContainer!
         * @type {Boolean}
         */
        this.dirty = false;

        /**
         * Will add a new element to the container.
         * Keys are not required, but only keyed elements are used to edit data from a data source.
         * Either pass:
         *
         * - Modoelements directly
         * - modoCore.FormSlot elements directly. Their internally added Modoelements (with keys) will be considered.
         * - DOM/jQuery elements directly
         * - Modoelements encapsulated in a object to add them with keys. Example: {mykey: someCUIelement}
         *
         * Modoelements that have been added with a key, can be used by FormContainers to be connected automatically to data sources.
         */
        this.add = function (){
            var o,
                oo,
                key,
                eobj,
                silent,
                events = [],
                wasKeyed = false;

            function listenFunc(v){
                settings.changeNotifier(this, v);
            }

            for (var i = 0; i < arguments.length; i++) {
                o = arguments[i];
                if(modoCore.isElement(o)){
                    //Modoelement, directly passed.
                    //Is it a modoCore.FormSlot element?
                    if(o instanceof modoCore.FormSlot){
                        oo = o.getElements();
                        for (key in oo) {
                            if(!modoCore.isGetSetElement(oo[key])){
                                throw new Error('Only get/set enabled elements can be added with a data-key.');
                            }
                            settings.elements[key] = oo[key];
                            this.listenTo(oo[key], 'change', listenFunc);
                        }
                    } else {
                        this.listenTo(o, 'change', listenFunc);
                    }
                    pAdd.call(this, o.el);
                    events.push(o);
                    continue;
                }
                //Check if its a keyed collection (object) of Modoelements.
                wasKeyed = false;
                for (key in o) {
                    if(modoCore.isElement(o[key])){
                        if(!modoCore.isGetSetElement(o[key])){
                            throw new Error('Only get/set enabled elements can be added with a data-key.');
                        }
                        settings.elements[key] = o[key];
                        eobj = {};
                        eobj[key] = o[key];
                        pAdd.call(this, o[key].el);
                        events.push(eobj);
                        wasKeyed = true;
                        continue;
                    }
                    break;
                }
                if(wasKeyed){
                    this.listenTo(o[key], 'change', function (v){
                        settings.changeNotifier(this, v);
                    });
                    continue;
                }
                pAdd.call(this, o);
                if(!silent){
                    events.push(o);
                }
            }

            if(!silent){
                for (key in events) {
                    this.trigger('add', events[key]);
                }
            }

            return this;
        };

        //TODO: Add the remove method?!
        this.remove = function (key, element){

        };

        /**
         * Will pass a new dataset into the container and will populate all children with a set() function and a given key
         * with its matching data.
         * @param data
         * @param options
         */
        this.set = function (data, options){
            var key,
                silent,
                that;

            options = options || {silent: false};

            silent = options.silent;

            if(data === undefined){
                data = this.defaultData;
            }

            this.stopListening();

            settings.data = data;
            if(data instanceof Backbone.Model){
                settings.preparedData = data.toJSON();
            } else {
                settings.preparedData = data;
            }

            for (key in settings.preparedData) {
                if(typeof settings.prepare[key] === 'function'){
                    settings.preparedData[key] = settings.prepare[key](settings.preparedData[key]);
                }
            }

            settings.preparedData = settings.finalPrepare(settings.preparedData);

            for (key in settings.preparedData) {
                if(typeof settings.elements[key] !== 'undefined'){
                    if(typeof settings.elements[key].set === 'function'){
                        settings.elements[key].set(settings.preparedData[key]);
                    }
                }
            }

            if(!silent){
                this.trigger('change', settings.preparedData);
            }

            that = this;
            _.each(this.getElements(), function (e){
                that.listenTo(e, 'change', function (v){
                    settings.changeNotifier(this, v);
                });
            });

            return this;
        };

        /**
         * Will return a getJSON()-like formatted object with all current values from all elements with a get()
         * method and a populated key.
         * @return {Object}
         */
        this.get = function (){
            var out = {},
                key;
            for (key in settings.elements) {
                out[key] = settings.elements[key].get();
            }
            return out;
        };

        /**
         * Returns an array of all added elements.
         * @return []
         */
        this.getElements = function (){
            return settings.elements;
        };

        /**
         * Writes all changed data back to the given dataset.
         * @param options
         */
        this.save = function (options){
            var silent,
                data,
                key;

            options = options || {};

            silent = options.silent;

            data = this.get();

            for (key in data) {
                if(typeof settings.clean[key] === 'function'){
                    data[key] = settings.clean[key](data[key]);
                }
            }

            data = settings.finalClean(data);

            if(settings.data instanceof Backbone.Model){
                settings.data.set(data);
            } else {
                settings.data = data;
            }

            this.dirty = false;

            if(!silent){
                this.trigger('save');
            }

            if(settings.autosync){
                if(settings.data instanceof Backbone.Model){
                    settings.data.save();
                }
            }

            return this;
        };

        /**
         * Offers a functionality like a normal HTML form provides and will send the data like if it would have been
         * sent through a HTML form element.
         * @param {Object} params
         * @param {String} params.target URL which should receive the data.
         * @param {String} params.method HTTP method (optional) default = POST
         * @param {Boolean} params.ajax Should the data be sent through a AJAX call, or with traditional form submission? (optional) default = true
         * @param {function} params.callback A function to be called after the data has been sent. Will receive an argument with the response string.
         */
        this.send = function (params){
            params = params || {};

            var inSet = {
                target: params.target || '',
                method: params.method || 'POST',
                ajax: (typeof params.ajax !== 'undefined') ? params.ajax : true,
                callback: params.callback || function (){
                }
            };

            var dta = this.get();

            if(settings.csrf){
                dta.csrfToken = settings.csrf;
            }

            if(inSet.ajax){
                $.ajax(inSet.target, {
                    data: dta,
                    type: inSet.method
                }).always(inSet.callback);
                return this;
            }

            var form = document.createElement('form');
            form.setAttribute('method', inSet.method);
            form.setAttribute('action', inSet.target);
            var elm;
            for (var key in dta) {
                elm = document.createElement('input');
                elm.setAttribute('type', 'hidden');
                elm.setAttribute('name', key);
                elm.setAttribute('value', dta[key]);
                form.appendChild(elm);
            }
            document.body.appendChild(form);
            form.submit();
            return this;
        };

        /**
         * Will try and set the input focus to the first element.
         */
        this.focus = function (){
            var key;

            for (key in settings.elements) {
                if(typeof settings.elements[key].focus === 'function'){
                    settings.elements[key].focus();
                    return;
                }
            }

            return this;
        };
    })
        .inheritPrototype('Container');

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.FormContainer;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('FormContainer', [], function (){
                return modoCore.FormContainer;
            });
        }
    }
})();
/**
 * Modo FormSlot
 * ============
 * The Modo Form Slot is a special kind of container to be used in modoCore.FormContainer elements.
 * The form slot can contain one or more control elements (and other elements) and adds a label to them.
 * Also, the form slot will be treated as multiple elements, when added to a form container.
 * @param params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('FormSlot', ['formslot', 'formslot-label', 'formslot-container'], function (params){
        params = params || {};

        modoCore.Container.call(this, params);

        this.addClass(modoCore.FormSlot.classNames[0]);

        var settings = {
            disabled: false,
            elements: {},
            label: params.label || ''
        };

        var $label = $('<div>' + settings.label + '</div>');
        $label.addClass(modoCore.cssPrefix + modoCore.FormSlot.classNames[1]);

        var $container = $('<div></div>');
        $container.addClass(modoCore.cssPrefix + modoCore.FormSlot.classNames[2]);

        this.el.append($label, $container);


        this.getElements = function (){
            return settings.elements;
        };

        /**
         * Setter for the elements label text.
         * @param {String} value
         */
        this.set = function (value, options){
            var silence;

            options = options || {};

            silence = options.silence;

            settings.label = value;
            $label.html(value);
            if(!silence){
                this.trigger('change', value);
            }
            return this;
        };

        this.get = function (){
            return settings.label;
        };

        /**
         * Will add a new element to the container.
         * Keys are not required, but only keyed elements are visible to a modoCore.FormContainer.
         * Either pass:
         *
         * - Modo elements directly
         * - DOM/jQuery elements directly
         * - Modo elements encapsulated in a object to add them with keys. Example: {mykey: someCUIelement}
         *
         * Modo elements that have been added with a key, can be used by FormContainers to be connected automatically to data sources.
         */
        this.add = function (){
            var o,
                key,
                eobj,
                wasKeyed = false,
                silence,
                events = [];

            for (var i = 0; i < arguments.length; i++) {
                o = arguments[i];
                if(modoCore.isElement(o)){
                    $container.append(o.el);
                    events.push(o);
                    continue;
                }
                //Check if its a keyed collection (object) of Modo elements.
                for (key in o) {
                    if(modoCore.isElement(o[key])){
                        settings.elements[key] = o[key];
                        eobj = {};
                        eobj[key] = o[key];
                        $container.append(o[key].el);
                        events.push(eobj);
                        wasKeyed = true;
                        if(settings.disabled && typeof o[key].disable === 'function'){
                            o[key].disable();
                        }
                        continue;
                    }
                    break;
                }
                if(wasKeyed){
                    continue;
                }
                if(modoCore.isDOM(o)){
                    $container.append(o);
                    events.push(o);
                } else {
                    silence = o.silence;
                }
            }

            if(!silence){
                for (o = 0; o < events.length; o++) {
                    this.trigger('add', events[o]);
                }
            }

            return this;
        };

        /**
         * Either pass the key of a keyed element here, or directly a unkeyed element.
         * @param key
         */
        this.remove = function (key){
            if(typeof settings.elements[key] !== 'undefined'){
                $container.remove(settings.elements[key].el);
                return this;
            }
            if(typeof key.el !== 'undefined'){
                $container.remove(key.el);
            } else {
                $container.remove(key);
            }
            return this;
        };

        this.disable = function (){
            var key;

            settings.disabled = true;

            for (key in settings.elements) {
                if(typeof settings.elements[key].disable === 'function'){
                    settings.elements[key].disable();
                }
            }

            this.el.addClass(modo.cssPrefix + 'disabled');
        };

        this.enable = function (){
            var key;

            settings.disabled = false;

            for (key in settings.elements) {
                if(typeof settings.elements[key].enable === 'function'){
                    settings.elements[key].enable();
                }
            }

            this.el.removeClass(modo.cssPrefix + 'disabled');
        };

        if(params.disabled){
            this.disable();
        }
    })
        .inheritPrototype('Container');


    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.FormSlot;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('FormSlot', [], function (){
                return modoCore.FormSlot;
            });
        }
    }
})();
/**
 * Modo Image
 * =========
 * A image object, enhanced by Modo methods.
 * Can - for example - be used inside a modoCore.FormContainer to display user avatars.
 *
 * @param params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('Image', ['image'], function (params){
        params = params || {};

        params.el = $('<img>');

        modoCore.Element.call(this, params);

        this.addClass(modoCore.Image.classNames[0]);

        var settings = {
            value: params.value || '',
            tooltip: params.tooltip || '',
            model: params.model || null,
            modelKey: params.modelKey || null
        };

        var that = this;

        this.el.on('load', function (e){
            that.trigger('ready', e);
        });

        if(settings.model instanceof Backbone.Model){
            if(!settings.modelKey){
                if(typeof params.value === 'function'){
                    params.model.on('change', function (){
                        that.set(params.value.call(that, params.model));
                    });
                } else {
                    throw new Error('Trying to bind to model, but no modelKey and no valueFunction given');
                }
            }

            settings.value = settings.model.get(settings.modelKey);

            settings.model.on('change:' + settings.modelKey, function (){
                that.set(settings.model.get(settings.modelKey));
            });
        }

        if(settings.value){
            this.el[0].src = settings.value;
        }

        if(settings.tooltip){
            this.el[0].title = settings.tooltip;
        }
    })
        .inheritPrototype('Element')
        .extendPrototype({
            get: function (){
                return this.el.attr('src');
            },

            set: function (url){
                this.el.attr('src', url);
                this.trigger('change', url);
                return this;
            }
        });

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.Image;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define(function (){
                return modoCore.Image;
            });
        }
    }
})();
/**
 * Modo PopUp Bubble
 * ================
 * A PopUp Bubble behaves a bit like a tooltip. It looks like a balloon, or a speech bubble and can be attached to
 * Modo elements or fixed positions on the screen.
 *
 * When opened, the PopUp Bubble will appear and can close itself when the user clicks somewhere on the screen.
 *
 * The most useful feature of the PopUp Bubble is its capability to attach itself relatively to another Modo element.
 * @param params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    //====================================================================

    /**
     * This calculates the position of the Bubble and places it there.
     * @param settings The Objects internal settings.
     */
    function calculatePosition(obj, settings){
        var target = settings.attachTo;
        if(modoCore.isElement(target)){
            target = target.el;
        }

        var targetPos = {
            x: target.offset().left,
            y: target.offset().top,
            w: target.outerWidth(),
            h: target.outerHeight()
        };

        var pos;

        switch (settings.attachAt) {
        case 'tr':
            pos = {
                top: targetPos.y - obj.el.outerHeight(),
                left: targetPos.x + (targetPos.w / 2)
            };
            break;
        case 'tc':
            pos = {
                top: targetPos.y - obj.el.outerHeight(),
                left: targetPos.x - (obj.el.outerWidth() / 2 - targetPos.w / 2)
            };
            break;
        case 'tl':
            pos = {
                top: targetPos.y - obj.el.outerHeight(),
                left: targetPos.x - (obj.el.outerWidth() - targetPos.w / 2)
            };
            break;

        case 'lt':
            pos = {
                top: targetPos.y,
                left: targetPos.x - obj.el.outerWidth()
            };
            break;
        case 'lc':
            pos = {
                top: targetPos.y - (obj.el.outerHeight() / 2 - targetPos.h / 2),
                left: targetPos.x - obj.el.outerWidth()
            };
            break;
        case 'lb':
            pos = {
                top: targetPos.y + targetPos.h - obj.el.outerHeight(),
                left: targetPos.x - obj.el.outerWidth()
            };
            break;

        case 'rt':
            pos = {
                top: targetPos.y,
                left: targetPos.x + targetPos.w
            };
            break;
        case 'rc':
            pos = {
                top: targetPos.y - (obj.el.outerHeight() / 2 - targetPos.h / 2),
                left: targetPos.x + targetPos.w
            };
            break;
        case 'rb':
            pos = {
                top: targetPos.y + targetPos.h - obj.el.outerHeight(),
                left: targetPos.x + targetPos.w
            };
            break;

        case 'br':
            pos = {
                top: targetPos.y + targetPos.h,
                left: targetPos.x + (targetPos.w / 2)
            };
            break;
        case 'bc':
            pos = {
                top: targetPos.y + targetPos.h,
                left: targetPos.x - (obj.el.outerWidth() / 2 - targetPos.w / 2)
            };
            break;
        case 'bl':
            pos = {
                top: targetPos.y + targetPos.h,
                left: targetPos.x - (obj.el.outerWidth() - targetPos.w / 2)
            };
            break;
        }

        obj.el.css(pos);
    }

    modoCore.defineElement('PopUpBubble', ['popupbubble', 'popupbubble-attach-'], function (params){
        params = params || {};

        params.modal = false;

        modoCore.PopUp.call(this, params);

        this.addClass(modoCore.PopUpBubble.classNames[0]);

        var settings = {
            attachTo: null,
            attachAt: null,
            visible: false,
            autoHide: params.autoHide || true
        };

        var _this = this;

        var closer = function (){
            _this.close();
        };

        var possiblePositions = ['tl', 'tc', 'tr', 'lt', 'lc', 'lb', 'rt', 'rc', 'rb', 'bl', 'bc', 'br'];

        /**
         * Attaches the PopUp Bubble to a element.
         * @param {modoCore.*} element
         * @param {String} position
         */
        this.attach = function (element, position){
            if(possiblePositions.indexOf(position) === -1){
                throw new Error('Illegal position');
            }

            settings.attachTo = element;
            settings.attachAt = position;

            if(_this.isOpen()){
                calculatePosition(_this, settings);
            }

            for (var i = 0; i < possiblePositions.length; i++) {
                this.el.removeClass(modoCore.cssPrefix + modoCore.PopUpBubble.classNames + possiblePositions[i]);
            }

            this.el.addClass(modoCore.cssPrefix + modoCore.PopUpBubble.classNames[1] + position);

            return this;
        };

        if(typeof params.attachTo !== 'undefined'){
            //TODO: Intelligently find out best attachment position based on Bubble dimensions and target location.
            this.attach(params.attachTo, params.attachAt || modoCore.PopUpBubble.BOTTOM);
        }

        this.on('open', function (){
            if(this.el.parent() != modoCore.getRootElement()){
                modoCore.getRootElement().append(this.el);
            }
            calculatePosition(_this, settings);
            setTimeout(function (){
                if(settings.autoHide){
                    $('body').one('click', closer);
                }
            }, 1);
        });

        this.on('close', function (){
            $('body').off('click', closer);
        });
    })
        .inheritPrototype('PopUp');

    modoCore.PopUpBubble.TOP = 'tc';
    modoCore.PopUpBubble.TOPLEFT = 'tl';
    modoCore.PopUpBubble.TOPRIGHT = 'tr';
    modoCore.PopUpBubble.LEFT = 'lc';
    modoCore.PopUpBubble.LEFTTOP = 'lt';
    modoCore.PopUpBubble.LEFTBOTTOM = 'lb';
    modoCore.PopUpBubble.RIGHT = 'rc';
    modoCore.PopUpBubble.RIGHTTOP = 'rt';
    modoCore.PopUpBubble.RIGHTBOTTOM = 'rb';
    modoCore.PopUpBubble.BOTTOM = 'bc';
    modoCore.PopUpBubble.BOTTOMLEFT = 'bl';
    modoCore.PopUpBubble.BOTTOMRIGHT = 'br';


    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.PopUpBubble;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('PopUpBubble', [], function (){
                return modoCore.PopUpBubble;
            });
        }
    }
})();
/**
 * Modo Calendar
 * ============
 * A simple calendar widget with the following features:
 * - Month selection
 * - Day selection
 * @param params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('Calendar', [
        'calendar',             //0
        'calendar-selector',
        'calendar-field',
        'calendar-prev',
        'calendar-next',
        'calendar-label',       //5
        'calendar-field-row',
        'calendar-field-day-names',
        'calendar-day',
        'calendar-day-disabled',
        'calendar-day-today',   //10
        'calendar-day-selected'
    ], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        var cn = [];
        for (var i = 0; i < modoCore.Calendar.classNames.length; i++) {
            cn.push(modoCore.cssPrefix + modoCore.Calendar.classNames[i]);
        }

        var settings = {
            minDate: (params.minDate instanceof Date) ? params.minDate : null,
            maxDate: (params.maxDate instanceof Date) ? params.maxDate : null,
            monthLabelFormat: params.monthLabelFormat || 'F Y',
            date: (typeof params.date !== 'undefined') ? new Date(params.date) : null,
            selectable: params.selectable || true,
            seekDate: null
        };
        settings.seekDate = settings.date;
        if(!(settings.seekDate instanceof Date)){
            settings.seekDate = new Date();
        }
        settings.seekDate.setDate(1);
        settings.seekDate.setHours(0);
        settings.seekDate.setMinutes(0);
        settings.seekDate.setSeconds(0);
        settings.seekDate.setMilliseconds(0);

        this.addClass(modoCore.Calendar.classNames[0]);

        this.el.html('<div class="' + cn[1] + '"></div>');

        var $calendarField = $('<div class="' + cn[2] + '"></div>');
        this.el.append($calendarField);

        //Previous/Next buttons.
        var btnPrev = new modoCore.Button({
            label: modoCore.Calendar.PREVIOUS,
            className: cn[3]
        });
        var btnNext = new modoCore.Button({
            label: modoCore.Calendar.NEXT,
            className: cn[4]
        });

        if(settings.minDate !== null && settings.date !== null && settings.date.getTime() < settings.minDate.getTime()){
            if(params.date){
                throw new Error('Given default date previous to given minimal date.');
            } else {
                settings.date = settings.seekDate = settings.minDate;
                settings.seekDate.setDate(1);
            }
        }

        if(settings.maxDate !== null && settings.date !== null && settings.date.getTime() > settings.maxDate.getTime()){
            if(params.date){
                throw new Error('Given default date after given maximal date.');
            } else {
                settings.date = settings.seekDate = settings.maxDate;
                settings.seekDate.setDate(1);
            }
        }

        btnPrev.on('click', function (e){
            e.preventDefault();
            e.stopPropagation();
            settings.seekDate.setMonth(settings.seekDate.getMonth() - 1);
            render();
            _this.trigger('seek');
        });

        btnNext.on('click', function (e){
            e.preventDefault();
            e.stopPropagation();
            settings.seekDate.setMonth(settings.seekDate.getMonth() + 1);
            render();
            _this.trigger('seek');
        });

        var $monthLabel = $('<div class="' + cn[5] + '"></div>');

        $('.' + cn[1], this.el).append(btnPrev.el, $monthLabel, btnNext.el);

        var _this = this;

        function render(){
            var html,
                dayCount = 0;

            $monthLabel.text(_this.dateToString(settings.monthLabelFormat, settings.seekDate));
            if(settings.minDate !== null && settings.seekDate.getMonth() === settings.minDate.getMonth() && settings.seekDate.getYear() === settings.minDate.getYear()){
                btnPrev.disable();
            } else {
                btnPrev.enable();
            }

            if(settings.maxDate !== null && settings.seekDate.getMonth() === settings.maxDate.getMonth() && settings.seekDate.getYear() === settings.maxDate.getYear()){
                btnNext.disable();
            } else {
                btnNext.enable();
            }

            var seek = new Date(settings.seekDate);
            var currentSeekMonth = seek.getMonth();

            var sub;
            if(seek.getDay() === 0){
                sub = 518400000;
            } else {
                sub = (seek.getDay() - 1) * 86400000;
            }
            seek.setTime(seek.getTime() - sub);


            html = '<div class="' + cn[6] + ' ' + cn[7] + '"><div class="' + cn[8] + '">';
            html += modoCore.Calendar.DAY_NAMES_SHORT.join('</div><div class="' + cn[8] + '">') + '</div></div>';

            var rowOpen = false,
                dayClasses,
                today = new Date(),
                cssKeys,
                cssKey;
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);
            today.setMilliseconds(0);

            while (dayCount < 42) {
                if(!rowOpen){
                    html += '<div class="' + cn[6] + '">';
                    rowOpen = true;
                }
                dayClasses = {};
                if(seek.getMonth() !== currentSeekMonth){
                    dayClasses[cn[9]] = true;
                }
                if(seek.getTime() === today.getTime()){
                    dayClasses[cn[10]] = true;
                }

                //Days before minDate and after_max date are blocked.
                if(settings.minDate !== null && settings.minDate.getTime() > seek.getTime()){
                    dayClasses[cn[9]] = true;
                }
                if(settings.maxDate !== null && settings.maxDate.getTime() < seek.getTime()){
                    dayClasses[cn[9]] = true;
                }

                if(settings.date !== null && seek.getDate() === settings.date.getDate() && seek.getMonth() === settings.date.getMonth() && seek.getFullYear() === settings.date.getFullYear()){
                    dayClasses[cn[11]] = true;
                }

                cssKeys = [];

                for (cssKey in dayClasses) {
                    if(dayClasses[cssKey]){
                        cssKeys.push(cssKey);
                    }
                }

                dayClasses = cssKeys.join(' ');

                html += '<div class="' + cn[8] + ' ' + dayClasses + '">' + seek.getDate() + '</div>';
                seek.setTime(seek.getTime() + 86400000);
                dayCount++;
                if((dayCount % 7) === 0){
                    html += '</div>';
                    rowOpen = false;
                }
            }
            html += '</div>';

            seek.setMonth(currentSeekMonth);
            seek.setDate(1);
            seek.setHours(0);
            seek.setMinutes(0);
            seek.setSeconds(0);
            seek.setMilliseconds(0);


            $calendarField.html(html);
        }

        if(settings.selectable){
            $calendarField.on('click', '.' + cn[8], function (e){
                e.preventDefault();
                e.stopPropagation();

                var $this = $(this);
                if($this.hasClass(cn[9])){
                    return;
                }
                $('.' + cn[8], _this.el).removeClass(cn[11]);
                $this.addClass(cn[11]);
                var selectedDate = new Date(settings.seekDate);
                selectedDate.setDate(parseInt($this.text(), 10));
                settings.date = selectedDate;
                _this.trigger('change', selectedDate);
            });
        }

        render();

        /**
         * Returns the Date object, currently used by the calendar.
         */
        this.get = function (){
            return settings.date;
        };

        this.set = function (inDate){
            settings.date = new Date(inDate);
            render();
            this.trigger('seek');
            this.trigger('change', settings.date);

            return this;
        };
    })
        .inheritPrototype('Element')
        .extendPrototype({
            /**
             * This outputs a string with a formatted date and follows roughly the PHP date() specification.
             * See: http://de2.php.net/manual/en/function.date.php
             * @param {String} format
             * @param {Date} inDate (optional)
             * @returns {String}
             */
            dateToString: function (format, inDate){
                if(typeof inDate === 'undefined'){
                    inDate = this.get();
                }

                if(!(inDate instanceof Date)){
                    inDate = new Date(inDate);
                }

                var output = '';

                var replacements = {
                    'd': (inDate.getDate() < 10) ? '0' + inDate.getDate() : inDate.getDate(),
                    'D': modoCore.Calendar.DAY_NAMES_SHORT[(inDate.getDay() === 0) ? 6 : inDate.getDay() - 1],
                    'j': inDate.getDate(),
                    'l': modoCore.Calendar.DAY_NAMES[(inDate.getDay() === 0) ? 6 : inDate.getDay() - 1],
                    'N': (inDate.getDay() === 0) ? 7 : inDate.getDay(),
                    'S': (inDate.getDate() < 4) ? modoCore.Calendar.SUFFIX[inDate.getDate()-1] : modoCore.Calendar.SUFFIX[3],
                    'w': inDate.getDate(),
                    'z': (function (inDate){
                        var day = 0;
                        var dte = new Date();
                        dte.setDate(1);
                        dte.setMonth(0);
                        dte.setYear(inDate.getFullYear());
                        while (day < 365) {
                            if(dte.getTime() > inDate.getTime()){
                                return day;
                            }
                            dte.setTime(dte.getTime() + 86400000);
                            day++;
                        }
                        return day;
                    })(inDate),
                    'W': (function (inDate){
                        var week = 0;
                        var dte = new Date();
                        dte.setDate(1);
                        dte.setMonth(0);
                        dte.setYear(inDate.getFullYear());
                        while (week < 52) {
                            if(dte.getTime() > inDate.getTime()){
                                return week;
                            }
                            dte.setTime(dte.getTime() + (86400000 * 7));
                            week++;
                        }
                        return week;
                    })(inDate),
                    'F': modoCore.Calendar.MONTH_NAMES[inDate.getMonth()],
                    'm': (inDate.getMonth() < 9) ? '0' + (inDate.getMonth() + 1) : inDate.getMonth() + 1,
                    'M': modoCore.Calendar.MONTH_NAMES_SHORT[inDate.getMonth()],
                    'n': inDate.getMonth() + 1,
                    't': (function (inDate){
                        var dte = new Date();
                        dte.setDate(1);
                        dte.setMonth((inDate.getMonth() < 11) ? inDate.getMonth() + 1 : 0);
                        dte.setYear((inDate.getMonth() < 11) ? inDate.getFullYear() : inDate.getFullYear() + 1);
                        dte.setHours(0);
                        dte.setMinutes(0);
                        dte.setSeconds(0);
                        dte.setMilliseconds(0);
                        dte.setTime(dte.getTime() - 1);
                        return dte.getDate();
                    })(inDate),
                    'L': (function (inDate){
                        var dte = new Date();
                        dte.setDate(1);
                        dte.setMonth(2);
                        dte.setYear(inDate.getFullYear());
                        dte.setHours(0);
                        dte.setMinutes(0);
                        dte.setSeconds(0);
                        dte.setMilliseconds(0);
                        dte.setTime(dte.getTime() - 1);
                        return (dte.getDate() === 29) ? 1 : 0;
                    })(inDate),
                    'Y': inDate.getFullYear(),
                    'y': String(inDate.getFullYear()).substr(2, 2),
                    'H': (inDate.getHours() < 10) ? '0' + inDate.getHours() : inDate.getHours(),
                    'i': (inDate.getMinutes() < 10) ? '0' + inDate.getMinutes() : inDate.getMinutes(),
                    's': (inDate.getSeconds() < 10) ? '0' + inDate.getSeconds() : inDate.getSeconds(),
                    'u': inDate.getMilliseconds()
                };

                var character;

                for (var i = 0; i < format.length; i++) {
                    character = format[i];
                    if(character === '\\'){
                        i += 1;
                        continue;
                    }
                    if(typeof replacements[character] === 'undefined'){
                        output += character;
                    } else {
                        output += replacements[character];
                    }
                }

                return output;
            }
        });

    modoCore.Calendar.PREVIOUS = '◀';
    modoCore.Calendar.NEXT = '▶';
    modoCore.Calendar.MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    modoCore.Calendar.MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    modoCore.Calendar.DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    modoCore.Calendar.DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    modoCore.Calendar.SUFFIX = ['st', 'nd', 'rd', 'th'];
})();

/**
 * Modo Dropdown
 * ============
 * Modo Dropdown enables the user to select an item from an Array or a Backbone Collection.
 * @param params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('DropDown', ['dropdown', 'dropdown-button', 'dropdown-list', 'dropdown-dropped'], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        this.addClass(modoCore.DropDown.classNames[0]);

        var $button = $('<div></div>');
        $button.addClass(modoCore.cssPrefix + modoCore.DropDown.classNames[1]);

        if(params.tooltip){
            $button.attr('title', params.tooltip);
        }

        this.el.append($button);

        var settings = {
            data: params.data,
            buttonRender: params.buttonRender || function (d){
                if(typeof d === 'string'){
                    return d;
                }
                for (var key in d) {
                    if(key === '_m'){
                        continue;
                    }
                    break;
                }
                return d[key].toString();
            },
            selectedItem: params.selectedItem !== undefined ? params.selectedItem : null,
            selectedData: null,
            placeholder: params.placeholder || ''
        };

        if(typeof params.data === 'function'){
            settings.data = params.data();
        }

        params.className = modoCore.cssPrefix + modoCore.DropDown.classNames[2];

        var _this = this;

        params.itemEvents = {
            'click': function (e, i){
                _this.set(i);
            }
        };

        var dropList = new modoCore.List(params);

        $button.on('click', function (e){
            if(_this.disabled){
                return;
            }
            _this.el.addClass(modoCore.cssPrefix + modoCore.DropDown.classNames[3]);
            e.stopPropagation();
            $('html').one('click', function (){
                _this.el.removeClass(modoCore.cssPrefix + modoCore.DropDown.classNames[3]);
            });
        });

        this.el.append(dropList.el);

        this.selectedItem = settings.selectedItem;
        this.selectedData = null;
        this.length = dropList.length;

        /**
         * This will set the dropdown to a specific item from the dataset.
         * If you passed a array as data, pass an array index as item.
         * If you passed a object as data, pass the key as item.
         * If you passed a Backbone Collection as data, pass a data id or cid.
         * @param {Integer|String} item
         */
        this.set = function (item, options){
            var silent;

            options = options || {};

            silent = options.silent;

            this.selectedItem = item;

            if(item === null){
                this.selectedData = null;
                $button.html(settings.buttonRender(settings.placeholder));
                this.trigger('change', null, null);
                return;
            }

            if(settings.data instanceof Backbone.Collection){
                this.selectedData = settings.data.get(item);
                $button.html(settings.buttonRender(this.selectedData.toJSON(), this.selectedData));
            } else {
                if(typeof settings.data[item] === 'undefined'){
                    throw new Error('Element "' + item + '" not found in dataset');
                }
                this.selectedData = settings.data[item];
                $button.html(settings.buttonRender(this.selectedData));
            }

            if(!silent){
                this.trigger('change', this.selectedItem, this.selectedData);
            }

            return this;
        };

        this.setDataset = function (dataset, options){
            dropList.set(dataset, options);
            this.set(this.selectedItem, {silent: true});
            this.length = dropList.length;

            return this;
        };

        this.get = function (){
            return this.selectedItem;
        };

        this.getData = function (){
            return this.selectedData;
        };

        this.set(settings.selectedItem, {silent: true});
    })
        .inheritPrototype('Element');

    modoCore.DropDown.prototype.disable = modoCore.Button.prototype.disable;
    modoCore.DropDown.prototype.enable = modoCore.Button.prototype.enable;
})();
/**
 * Modo Grid
 * =========
 * Use this element to present information in a tabular structure.
 * Unlike the modoCore.List element, data is separated into single columns in the grid element.
 * You can specify renderers or presentor elements for every column separately.
 * The Modo Grid supports arrays and Backbone.Collection as datasources.
 * @param params
 * @constructor
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('Grid', ['grid', 'grid-header', 'grid-row', 'grid-cell', 'grid-column-'], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        this.addClass(modoCore.Grid.classNames[0]);

        /*var params = {
         columns: [
         {
         key: 'some_key',            //The key to use from the datasource.
         title: 'The column header', //HTML possible
         render: function(d){
         return d.toString();    //HTML, or a Modo Element is expected. Will be wrapped into a additional DIV.
         },
         required: false             //Decide if this column can be user-selected or must be shown.
         }
         ],
         */
        /**
         * The prepare function is called before each column render.
         * You can make up own columns out of data which is generated dynamically upon table creation.
         * @param d
         * @return {*}
         */
        /*
         prepare: function(d){
         return d;
         },
         visibleColumns: ['key_a', 'key_b'], //Predefined column selection
         rowTag: 'div',
         cellTag: 'div'
         };*/

        var settings = {
            data: params.data,
            collector: params.collector || function (c){
                return c.filter(function (){
                    return true;
                });
            },
            updateOn: params.updateOn || ['add', 'change', 'remove', 'sort'],
            columns: params.columns,
            prepare: params.prepare || function (d){
                return d;
            },
            visibleColumns: params.visibleColumns || null,
            rowTag: params.rowTag || 'div',
            cellTag: params.cellTag || 'div'
        };

        if(!(settings.data instanceof Backbone.Collection) && !(settings.data instanceof Array)){
            throw new Error('Only data type Array or Backbone.Collection allowed. Yours is: ' + typeof settings.data);
        }

        _.each(settings.columns, function (c){
            if(typeof c.render === 'undefined'){
                c.render = function (d){
                    return d.toString();
                };
                c.title = c.title || '';
            }
        });

        /**
         * Will trigger a re-render of the grid.
         * @param options
         */
        this.update = function (options){
            var html = '',
                rowHtml = '',
                rowData,
                dataset,
                columnPack = [],
                ids = [],
                silent,
                i,
                c,
                result,
                cellCount = 0,
                $cells,
                that = this,
                modoElements = [],
                cH = modoCore.cssPrefix + modoCore.Grid.classNames[1],
                cR = modoCore.cssPrefix + modoCore.Grid.classNames[2],
                cC = modoCore.cssPrefix + modoCore.Grid.classNames[3],
                cClm = modoCore.cssPrefix + modoCore.Grid.classNames[4];

            options = options || {};

            silent = options.silent;

            function makeRow(content, isHeader){
                return '<' + settings.rowTag + ' class="' + cR + (isHeader ? ' ' + cH : '') + '">' + content + '</' + settings.rowTag + '>';
            }

            function makeCell(content, column){
                cellCount++;
                return '<' + settings.cellTag + ' class="' + cC + ' ' + cClm + column + '">' + content + '</' + settings.cellTag + '>';
            }

            if(settings.visibleColumns === null){
                columnPack = settings.columns;
            } else {
                for (i = 0; i < settings.columns.length; i++) {
                    if(settings.visibleColumns.indexOf(settings.columns[i].key) !== -1){
                        columnPack.push(settings.columns[i]);
                    }
                }
            }

            _.each(columnPack, function (c){
                rowHtml += makeCell(c.title, c.key);
            });
            html = makeRow(rowHtml, true);

            if(settings.data instanceof Backbone.Collection){
                dataset = settings.collector(settings.data);
            } else {
                dataset = settings.data;
            }
            _.each(dataset, function (e){
                var key;

                ids.push(e.id || e.cid);
                rowHtml = '';
                rowData = settings.prepare(e);
                for (i = 0; i < columnPack.length; i++) {
                    c = columnPack[i];
                    if(typeof rowData[c.key] === 'undefined'){
                        throw new Error('Undefined field "' + c.key + '" in row data.');
                    }
                    result = c.render(rowData[c.key]);
                    if(modoCore.isElement(result)){
                        c.isModo = true;
                        modoElements.push([cellCount, result]);
                        if(typeof c.events !== 'undefined'){
                            for (key in c.events) {
                                if(!c.events.hasOwnProperty(key)){
                                    continue;
                                }
                                that.listenTo(result, key, function (e, v){
                                    c.events[key].call(this, e, v, rowData);
                                });
                            }
                        }
                        result = '';
                    }
                    rowHtml += makeCell(result, c.key);
                }
                html += makeRow(rowHtml);
            });

            this.el.html(html);

            $cells = this.el.find('.' + modoCore.cssPrefix + modoCore.Grid.classNames[3]);
            for (i = 0; i < modoElements.length; i++) {
                $cells.eq(modoElements[i][0]).append(modoElements[i][1].el);
            }

            if(!silent){
                this.trigger('update');
            }

            return this;
        }

        this.update({silent: true});
    })
        .inheritPrototype('Element');


    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.Grid;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define(function (){
                return modoCore.Grid;
            });
        }
    }
})();
/**
 * modo-Checkbox
 * ===========
 * A CheckBox Element. It can either have a label, or not.
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    function cn(index, prefixed){
        if(prefixed !== undefined){
            return modoCore.Checkbox.classNames[index];
        }
        return modoCore.cssPrefix + modoCore.Checkbox.classNames[index];
    }

    modoCore.defineElement('Checkbox', ['checkbox', 'checkbox-label', 'checked'], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        this.addClass(cn(0, true));

        if(!params.custom){
            this.$checkbox = $('<input type="checkbox">');
            this.$checkbox.on('click', function(e){
                e.preventDefault();
                e.stopPropagation();
                that.set(!that.value);
            });
        } else {
            this.$checkbox = $('<span class="' + cn(0) + '"></span>');
        }

        this.el.append(this.$checkbox, $('<span class="' + cn(1) + '">' + (params.label || '') + '</span>'));

        this.value = false;

        var that = this;

        if(params.tooltip){
            this.el.attr('title', params.tooltip);
        }

        this.el.on('click', function (e){
            e.preventDefault();
            e.stopPropagation();
            that.set(!that.value);
        });

        if(params.model){
            if(!params.modelKey){
                throw new Error('Trying to bind to model, but no model key given');
            } else {
                params.value = params.model.get(params.modelKey);

                params.model.on('change:' + params.modelKey, function (){
                    that.set(params.model.get(params.modelKey));
                });
            }
        }

        this.set = function (value, options){
            var silent;

            options = options || {};

            silent = options.silent;

            if(value){
                this.value = true;
            }
            else {
                this.value = false;
            }

            this.$checkbox.prop('checked', this.value);

            this.el.toggleClass(cn(2), this.value);

            if(params.model && params.modelKey){
                params.model.set(params.modelKey, this.value);
            }

            if(!silent){
                this.trigger('change', this.value);
            }

            return this;
        };

        if(params.value !== undefined){
            this.set(params.value, {silent: true});
        }

        if(params.disabled === true){
            this.disable();
        }

    })
        .inheritPrototype('Element')
        .extendPrototype({
            enable: function (options){
                var silent;

                options = options || {};

                silent = options.silent;

                this.removeClass(modo.Element.classNames[2]);
                this.$checkbox.prop('disabled', false);

                if(!silent){
                    this.trigger('enabled');
                }

                return this;
            },
            disable: function (options){
                var silent;

                options = options || {};

                silent = options.silent;

                this.addClass(modo.Element.classNames[2]);
                this.$checkbox.prop('disabled', true);

                if(!silent){
                    this.trigger('disabled');
                }

                return this;
            },
            get: function (){
                return this.value;
            }
        });

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modo.Checkbox;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('Checkbox', [], function (){
                return modo.Checkbox;
            });
        }
    }
})();
/**
 * modo-Toolbar
 * ============
 * The modo toolbar can keep multiple buttons that can be clicked or toggled.
 * The toolbar is treated as ONE element that fires events upon user interaction.
 * Child elements are only created in the DOM and don't have any modo interface.
 *
 * A toolbar can have containers to group buttons together.
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    modoCore.defineElement('Toolbar', ['toolbar', 'toolbar-container', 'toolbar-container-empty', 'toolbar-item', 'toolbar-item-group-', 'toolbar-item-toggled'], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        this.addClass(modoCore.Toolbar.classNames[0]);

        var settings = {
            elements: params.elements || []
        };

        var that = this,
            keys = [];

        /**
         * Returns the element object with the given key.
         * @param {String} key
         * @returns {Object|null}
         */
        function findElement(inKey, sub){
            var result;

            if(!sub){
                sub = settings.elements;
            }

            for (var key in sub) {
                if(sub[key] instanceof Array){
                    result = findElement(inKey, sub[key]);
                    if(result){
                        return result;
                    }
                }

                if(sub[key].key === inKey){
                    return sub[key];
                }
            }

            return null;
        }

        /**
         * Returns all objects that belong to a given group.
         * @param {String} group
         * @returns {Array}
         */
        function findElementsByGroup(group, sub){
            var result;

            result = [];

            if(!sub){
                sub = settings.elements;
            }

            for (var key in sub) {
                if(sub[key] instanceof Array){
                    result = result.concat(findElementsByGroup(group, sub[key]));
                }

                if(sub[key].group === group){
                    result.push(sub[key]);
                }
            }

            return result;
        }

        /**
         * Returns all elements in the container with the given index.
         * Returns an empty array, if the container was not found, or empty.
         * @param index
         * @returns Array
         */
        function findElementsInContainer(index){
            var checkIndex,
                i;

            checkIndex = 0;

            for (i = 0; i < settings.elements.length; i++) {
                if(settings.elements[i] instanceof Array){
                    if(checkIndex === index){
                        return settings.elements[i];
                    }
                    checkIndex++;
                }
            }
            return [];
        }

        function render(root, sublevel){
            var html = '',
                i,
                o,
                key,
                cAttrs;

            if(sublevel){

                html += '<div class="' + modoCore.cssPrefix + modoCore.Toolbar.classNames[1];
                if(!root.length){
                    html += ' ' + modoCore.cssPrefix + modoCore.Toolbar.classNames[2];
                }
                html += '">';
            } else {
                keys = [];
            }

            for (i = 0; i < root.length; i++) {
                o = root[i];
                if(o instanceof Array){
                    if(sublevel){
                        throw new Error('You cannot stack containers in a toolbar');
                    }
                    html += render(o, true);
                    continue;
                }

                if(!o.key){
                    throw new Error('No element key given');
                }

                if(keys.indexOf(o.key) !== -1){
                    throw new Error('Duplicate key: ' + o.key);
                }
                keys.push(o.key);

                cAttrs = [];
                if(o.data){
                    for (key in o.data) {
                        if(o.data.hasOwnProperty(key)){
                            cAttrs.push(' data-' + key + '="' + o.data[key] + '"');
                        }
                    }
                }

                html += '<button class="' +
                        modoCore.cssPrefix + modoCore.Toolbar.classNames[3] + ' ' +
                        modoCore.cssPrefix + modoCore.Toolbar.classNames[3] + '-' + o.key +
                        ((o.group) ? ' ' + modoCore.cssPrefix + modoCore.Toolbar.classNames[4] + o.group : '') +
                        ((o.disabled) ? ' ' + modoCore.cssPrefix + modoCore.Element.classNames[2] : '') +
                        ((o.className) ? ' ' + o.className : '') +
                        ((o.toggle) ? ' ' + modoCore.cssPrefix + modoCore.Toolbar.classNames[5] : '') +
                        '" data-key="' + o.key + '"' + cAttrs.join('') + ' title="' + (o.tooltip || '') + '">' + (o.label || '') + '</button>';
            }

            if(sublevel){
                html += '</div>';
                return html;
            }

            that.el.html(html);
        }

        /**
         * Returns a jQuery enhanced reference to the DOM element of the button with the given key.
         * @param key
         * @return {*|jQuery|HTMLElement}
         */
        this.getElementByKey = function (key){
            if(keys.indexOf(key) === -1){
                throw new Error('Unknown key');
            }
            return $('.' + modoCore.cssPrefix + modoCore.Toolbar.classNames[3] + '-' + key, this.el);
        };

        /**
         * Adds a new element to the element list.
         * @param key
         * @param className
         * @param tooltip
         */
        this.add = function (obj){
            settings.elements.push(obj);
            render(settings.elements);

            return this;
        };

        /**
         * Adds a new element to the container with the given index.
         */
        this.addToContainer = function (containerIndex, obj){
            var i,
                cnt;

            i = 0;

            _.each(settings.elements, function (elm){
                if(elm instanceof Array){
                    i++
                    if(i - 1 === containerIndex){
                        elm.push(obj);
                        return false;
                    }
                }
            });

            render(settings.elements);

            return this;
        }

        /**
         * Removes the button with the given key.
         */
        this.remove = function (key, sub){
            var i,
                e,
                that,
                success;

            that = this;

            for (i = 0; i < settings.elements.length; i++) {
                e = settings.elements[i];

                if(e instanceof Array){
                    if(that.remove(key, true)){
                        success = true;
                        break;
                    }
                }

                if(e.key === key){
                    settings.elements.splice(i, 1);
                    success = true;
                    break;
                }
            }

            if(!sub && !success){
                throw new Error('Element not found');
            }

            if(sub){
                return success;
            }

            return this;
        }

        /**
         * Removes the given container.
         */
        this.removeContainer = function (index){
            var i,
                e,
                containerIndex;

            containerIndex = 0;

            for (i = 0; i < settings.elements.length; i++) {
                e = settings.elements[i];

                if(e instanceof Array){
                    if(index === containerIndex){
                        settings.elements.splice(i, 1);
                        return this;
                    } else {
                        containerIndex++;
                    }
                }
            }

            throw new Error('Element not found');
        }

        /**
         * Enables a toolbar button for user interaction.
         * @param key
         */
        this.enableButton = function (key){
            findElement(key).disabled = false;
            render(settings.elements);
            return this;
        };

        /**
         * Disables a toolbar button for user interaction.
         * @param key
         */
        this.disableButton = function (key){
            findElement(key).disabled = true;
            render(settings.elements);
            return this;
        }

        /**
         * Enables all buttons of the given logical group.
         * @param name
         */
        this.enableGroup = function (name, inverted){
            var groupButtons,
                i;

            groupButtons = findElementsByGroup(name);

            for (i = 0; i < groupButtons.length; i++) {
                groupButtons[i].disabled = !!inverted;
            }
            render(settings.elements);
            return this;
        };

        /**
         * Disables all buttons of the given logical group.
         * @param name
         */
        this.disableGroup = function (name){
            return this.enableGroup(name, false);
        };

        /**
         * Enables all buttons inside the container with the given index.
         * @param index
         */
        this.enableContainer = function (index, inverted){
            var buttons,
                i;

            buttons = findElementsInContainer(index);

            for(i = 0; i < buttons.length; i++){
                buttons[i].disabled = !!inverted;
            }

            render(settings.elements);

            return this;
        };

        /**
         * Disables all buttons inside the container with the given index.
         * @param index
         */
        this.disableContainer = function (index){
            return this.enableContainer(index, false);
        };

        /**
         * Toggles a button in a group programmatically.
         */
        this.toggleButton = function (key){
            var o,
                groupElements,
                previousKey;

            o = findElement(key);

            if(!o.group){
                throw new Error('Can only toggle grouped buttons');
            }

            groupElements = findElementsByGroup(o.group);
            for (key in groupElements) {
                if(groupElements[key].toggle && groupElements[key].key !== o.key){
                    previousKey = groupElements[key].key;
                    this.trigger('untoggle:' + groupElements[key].key);
                    groupElements[key].toggle = false;
                    break;
                }
            }
            o.toggle = true;
            this.trigger('toggle:' + o.key);
            this.trigger('grouptoggle:' + o.group, o.key, previousKey);
            render(settings.elements);
            return this;
        }

        this.el.on('click', '.' + modoCore.cssPrefix + modoCore.Toolbar.classNames[3], function (e){
            var $this = $(this),
                o,
                groupElements,
                key;

            o = findElement($this.attr('data-key'));

            if(!o){
                throw new Error('No element found for this key');
            }

            if($this.hasClass(modoCore.cssPrefix + modoCore.Element.classNames[3])){
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            if(o.group && !o.toggle){
                that.toggleButton(o.key);
            }

            that.trigger('click:' + $this.attr('data-key'));
            that.trigger('click', e, $this.attr('data-key'));
        });

        render(settings.elements);
    })
        .inheritPrototype('Element');
})();
/**
 * modo-Menu
 * =========
 * The Modo Menu Element provides you drop down style menus known
 * from virtually any kind of desktop application.
 *
 * Menu items support display of:
 *
 * - Icons
 * - Hotkeys
 * - Sub-Menus
 * - Quick-Access keys
 * - Checkboxes
 * - Radio buttons
 * - Separators
 *
 * Menus can be either navigated by mouse, or keyboard.
 * Menus can be either rendered with a base level (first level
 * of the menu is rendered as horizontal list), or as a single
 * list that can be spawned anywhere.
 *
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    function cn(index, noPrefix){
        if(noPrefix){
            return modoCore.Menu.classNames[index];
        }
        return modoCore.cssPrefix + modoCore.Menu.classNames[index];
    }

    function render(obj, settings){
        var html = '',
            key,
            e,
            re,
            keys = [],
            callbacks = [];


        for (key in settings.elements) {
            e = settings.elements[key];

            if(!e.label){
                html += '<div class="' + cn(11) + '"></div>';
                continue;
            }

            keys.push(e.ref);
            callbacks.push(e.callback);

            if(e.hotkey){
                re = new RegExp('(' + e.hotkey.toLowerCase() + '|' + e.hotkey.toUpperCase() + ')');
                e.label = e.label.replace(re, '<span class="' + cn(9) + '">$1</span>');
            }

            html += '<div class="' + cn(5) + (e.disabled ? ' ' + modoCore.cssPrefix + modoCore.Element.classNames[2] : '') + (e.children && e.children.length ? ' ' + cn(2) : '') + '">' +
                    '<div class="' + cn(7) + (e.icon ? ' ' + cn(4, true) + e.icon : '') + '"></div>' +
                    '<div class="' + cn(6) + '">' + e.label + '</div>' +
                    (e.info ? '<div class="' + cn(8) + '">' + e.info + '</div>' : '') +
                    '</div>';
        }

        settings.keys = keys;
        settings.callbacks = callbacks;

        obj.el.html(html);
    }

    modoCore.defineElement('Menu', [
        'menu',
        'menu-dropdown',
        'menu-has-children',
        'menu-baseline',
        'icon-',
        'menu-item',
        'menu-item-label',
        'menu-item-field',
        'menu-item-info',
        'hotkey',
        'selected',
        'divider',
        'first-sublevel'
    ], function (params){
        params = params || {};

        var key,
            sub;

        modoCore.Element.call(this, params);

        this.addClass(modoCore.Menu.classNames[0]);

        /*var data = [
         {
         label: 'File',                  //Obvious
         hotkey: 'F',                    //Hit "F" on the keyboard to mark this item.
         info: 'STRG+Q',                 //Displays an additional info label at the end of the element. Can be used to
         show action key-strokes.
         icon: 'name',                   //Adds class 'mdo-icon-name'
         disabled: false,                //Should the element be rendered as disabled?
         ref: 'my-id',                   //Set a unique identifier here to access this item.
         checkbox: true,                 //Checkbox beats Icon.
         radio: true,                    //Radio beats Checkbox beats Icon.
         radio_group: 'groupname',       //Only one radio element per group can be selected.
         radio_value: '',                //Value will be returned in select events.
         children: []                    //Add another layer to the menu
         },
         {
         label: '' //Makes a separator, ignores other stuff
         }
         ];*/

        var settings = {
            elements: params.elements,
            autoHotkey: params.autoHotkey || false,
            baseLevel: params.baseLevel || false,
            keys: [],
            callbacks: [],
            selectedIndex: null,
            all: null,
            oldFocus: null,
            children: []
        };

        var that = this;

        if(settings.baseLevel){
            this.addClass(modoCore.Menu.classNames[3]);
        } else {
            this.addClass(modoCore.Menu.classNames[1]);
        }

        render(this, settings);

        for (key in settings.elements) {
            if(settings.elements[key].children){
                sub = new modoCore.Menu({
                    elements: settings.elements[key].children
                });
                if(settings.baseLevel){
                    sub.addClass(cn(12, true));
                }
                settings.children.push(sub);
            } else {
                settings.children.push(null);
            }
        }

        settings.all = this.el.find('.' + cn(5));

        this.el.on('mousemove', '.' + cn(5), function (){ //menu-item
            //Get the selected items index.
            var index = settings.all.index(this);

            if(this.className.match('disabled')){
                settings.selectedIndex = null;
                settings.all.removeClass(cn(10));
                return;
            }

            if(settings.selectedIndex === index){
                return;
            }

            settings.selectedIndex = index;

            settings.all.removeClass(cn(10)); //selected
            $(this).addClass(cn(10));
        });

        this.el.on('mouseout', function (){
            settings.selectedIndex = null;
            settings.all.removeClass(cn(10));
        });

        this.el.on('click', '.' + cn(5), function (){
            var i;

            i = settings.selectedIndex;

            if(i === null){
                return;
            }

            if(settings.children[i]){
                settings.children[i].showAtElement(this, settings.baseLevel ? modo.Menu.BOTTOM : modo.Menu.RIGHT);
            }

            that.trigger('select', settings.keys[i]);

            var c = settings.callbacks[i];
            if(typeof c === 'function'){
                c();
            }
        });

        if(!settings.baseLevel){
            this.hide();
        }

        var hidefunc = function (){
            that.hide();
        };

        var keycapture = function (e, key){
            e.stopPropagation();
            e.preventDefault();
            switch (key) {
            case 'up':
                if(settings.selectedIndex === null){
                    settings.selectedIndex = 0;
                } else {
                    settings.selectedIndex--;
                    if(settings.selectedIndex < 0){
                        settings.selectedIndex = settings.all.size() - 1;
                    }
                }
                settings.all.removeClass(cn(9));
                settings.all.eq(settings.selectedIndex).addClass(cn(9));
                break;

            case 'down':
                if(settings.selectedIndex === null){
                    settings.selectedIndex = 0;
                } else {
                    settings.selectedIndex++;
                    if(settings.selectedIndex > settings.all.size() - 1){
                        settings.selectedIndex = 0;
                    }
                }
                settings.all.removeClass(cn(9));
                settings.all.eq(settings.selectedIndex).addClass(cn(9));
                break;

            case 'escape':
                that.hide();
                modoCore.getRootElement().off('click', hidefunc);
                break;
            }
        };

        this.on('show', function (){
            settings.oldFocus = document.activeElement;

            settings.oldFocus.blur();

            setTimeout(function (){
                modoCore.getRootElement().one('click', hidefunc);
            }, 1);

            modoCore.keyListener.on('keyPress', keycapture);
        });

        this.on('hide', function (){
            settings.oldFocus.focus();
            settings.oldFocus = null;

            settings.all.removeClass(cn(9));
            settings.selectedIndex = null;
            modoCore.keyListener.off('keyPress', keycapture);
        });

        modoCore.keyListener.enable();

        if(!settings.baseLevel){
            modoCore.getRootElement().append(this.el);
        }
    })
        .inheritPrototype('Element')
        .extendPrototype({
            /**
             * Position the menu object at another modo- or DOM-Element and display it.
             * @param {modo.Element} element
             * @param {Integer} [position=modoCore.Menu.Right]
             */
            showAtElement: function (element, position){
                var el,
                    pX,
                    pY;

                if(position === undefined){
                    position = 0;
                }

                if(modoCore.isElement(element)){
                    el = element.el;
                }
                if(modoCore.isDOM(element)){
                    el = $(element);
                }
                if(!el){
                    throw new Error('Illegal element');
                }

                var offs = el.offset();

                pX = pY = 0;

                switch (position) {
                case 0:
                    pY = -this.el.outerHeight();
                    break;
                case 1:
                    pY = el.outerHeight();
                    break;
                case 2:
                    pX = -el.outerWidth();
                    break;
                case 3:
                    pX = this.el.outerWidth();
                }

                this.el.css({
                    top: offs.top + pY,
                    left: offs.left + pX
                });
                this.show();
            },
            /**
             * Position the menu at the current mouse position and display it.
             */
            showAtCursor: function (){
                this.el.css({
                    top: modoCore.mousePosition.y,
                    left: modoCore.mousePosition.x
                });
                this.show();
            }
        });

    modoCore.Menu.TOP = 0;
    modoCore.Menu.BOTTOM = 1;
    modoCore.Menu.LEFT = 2;
    modoCore.Menu.RIGHT = 3;

    /**
     * Observe the global (inside the mdo-root) cursor position and store it.
     * Note: might become obsolete with some coming-soon module.
     */
    modoCore.once('init', function (){
        modoCore.getRootElement().on('mousemove', function (e){
            var $this = $(this),
                $window = $(window),
                offs = $this.offset(),
                pos = {
                    x: (e.pageX - offs.left) + $window.scrollLeft(),
                    y: (e.pageY - offs.top) + $window.scrollTop()
                };
            modoCore.mousePosition = pos;
        });
    });
})();

/**
 * modo-keylistener
 * ================
 * The keylistener object is no creatable element, but attaches itself to the modo object.
 * Once enabled with modoCore.keyListener.enable(), it observes any keystroke made and emits
 * events according to it.
 *
 * Its possible to submit a scope to the key-listener, to make it possible to forward
 * key events to only a single element temporarily.
 *
 * @TODO: Check english keymap
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }


    var enabled,
        disabled,
        scopes,
        pressed;

    enabled = false;
    disabled = false;
    scopes = [];
    pressed = {};

    modoCore.keyListener = {
        keymap: {
            en: {
                8: 'backspace',
                9: 'tab',
                13: 'enter',
                16: 'shift',
                17: 'ctrl',
                18: 'alt',
                19: 'pause',
                20: 'capslock',
                27: 'escape',
                32: 'space',
                33: 'pageup',
                34: 'pagedown',
                35: 'end',
                36: 'home',
                37: 'left',
                38: 'up',
                39: 'right',
                40: 'down',
                45: 'insert',
                46: 'delete',

                48: '0',
                49: '1',
                50: '2',
                51: '3',
                52: '4',
                53: '5',
                54: '6',
                55: '7',
                56: '8',
                57: '9',

                65: 'a',
                66: 'b',
                67: 'c',
                68: 'd',
                69: 'e',
                70: 'f',
                71: 'g',
                72: 'h',
                73: 'i',
                74: 'j',
                75: 'k',
                76: 'l',
                77: 'm',
                78: 'n',
                79: 'o',
                80: 'p',
                81: 'q',
                82: 'r',
                83: 's',
                84: 't',
                85: 'u',
                86: 'v',
                87: 'w',
                88: 'x',
                89: 'y',
                90: 'z',

                91: 'win',

                96: '0',
                97: '1',
                98: '2',
                99: '3',
                100: '4',
                101: '5',
                102: '6',
                103: '7',
                104: '8',
                105: '9',
                106: '*',
                107: '+',
                109: '-',

                111: '/',
                112: 'f1',
                113: 'f2',
                114: 'f3',
                115: 'f4',
                116: 'f5',
                117: 'f6',
                118: 'f7',
                119: 'f8',
                120: 'f9',
                121: 'f10',
                122: 'f11',
                123: 'f12',
                144: 'numlock',
                145: 'scrolllock',
                186: ';',
                187: '+',
                188: ',',
                189: '-',
                190: '.',
                191: '/',
                192: '`',
                219: '(',
                220: '^',
                221: '´',
                222: '`',
                226: '\\'
            },
            de: {
                8: 'backspace',
                9: 'tab',
                13: 'enter',
                16: 'shift',
                17: 'ctrl',
                18: 'alt',
                19: 'pause',
                20: 'capslock',
                27: 'escape',
                32: 'space',
                33: 'pageup',
                34: 'pagedown',
                35: 'end',
                36: 'home',
                37: 'left',
                38: 'up',
                39: 'right',
                40: 'down',
                45: 'insert',
                46: 'delete',

                48: '0',
                49: '1',
                50: '2',
                51: '3',
                52: '4',
                53: '5',
                54: '6',
                55: '7',
                56: '8',
                57: '9',

                65: 'a',
                66: 'b',
                67: 'c',
                68: 'd',
                69: 'e',
                70: 'f',
                71: 'g',
                72: 'h',
                73: 'i',
                74: 'j',
                75: 'k',
                76: 'l',
                77: 'm',
                78: 'n',
                79: 'o',
                80: 'p',
                81: 'q',
                82: 'r',
                83: 's',
                84: 't',
                85: 'u',
                86: 'v',
                87: 'w',
                88: 'x',
                89: 'y',
                90: 'z',

                91: 'win',

                96: '0',
                97: '1',
                98: '2',
                99: '3',
                100: '4',
                101: '5',
                102: '6',
                103: '7',
                104: '8',
                105: '9',
                106: '*',
                107: '+',
                109: '-',

                111: '/',
                112: 'f1',
                113: 'f2',
                114: 'f3',
                115: 'f4',
                116: 'f5',
                117: 'f6',
                118: 'f7',
                119: 'f8',
                120: 'f9',
                121: 'f10',
                122: 'f11',
                123: 'f12',
                144: 'numlock',
                145: 'scrolllock',
                186: 'ü',
                187: '+',
                188: ',',
                189: '-',
                190: '.',
                191: '#',
                192: 'ö',
                219: 'ß',
                220: '^',
                221: '´',
                222: 'ä',
                226: '<'
            }
        },
        lastKey: null,
        /**
         * Enables the key listening.
         * options = {
         *  repetitive: false //Decide if holding a key fires the same event all the time.
         * }
         * @param options
         */
        enable: function (options){
            if(enabled){
                disabled = false;
                return;
            }

            options = options || {};
            disabled = false;

            $(window).on('keydown',function (e){
                if(disabled){
                    return;
                }

                var altKey = e.altKey,
                    shiftKey = e.shiftKey,
                    ctrlKey = e.ctrlKey,
                    metaKey = e.metaKey,
                    key = e.keyCode,
                    keyname,
                    strokename;

                keyname = keymap[key] || '';

                strokename = ctrlKey ? 'ctrl' : '';

                if(shiftKey){
                    if(strokename){
                        strokename += '+';
                    }
                    strokename += 'shift';
                }
                if(altKey){
                    if(strokename){
                        strokename += '+';
                    }
                    strokename += 'alt';
                }
                if(strokename){
                    strokename += '+';
                }
                strokename += keyname;

                if((shiftKey || ctrlKey || altKey || metaKey) && keyname !== 'shift' && keyname !== 'ctrl' && keyname !== 'alt'){
                    modoCore.keyListener.trigger('stroke', e, strokename);
                }

                pressed[keyname] = true;

                if(keyname){
                    modoCore.keyListener.trigger(keyname, e, keyname);
                    modoCore.keyListener.trigger('keyPress', e, keyname);
                }
            }).on('keyup',function (e){
                    var key,
                        keyname;

                    key = e.keyCode;
                    keyname = keymap[key] || '';

                    delete pressed[keyname];
                }).focus();
            enabled = true;
        },
        /**
         * Use this method to disable the keyListener after it has been enabled.
         */
        disable: function (){
            disabled = true;
        },

        /**
         * Will shift the current event scope to the submitted namespace.
         * Can be called multiple times - if a later scope is being released, the scope switches back to the
         * previous state until no more scopes are active.
         * @param {modoCore.Element|String} newScope
         */
        setScope: function (newScope){
            scopes.push(newScope.modoId || newScope);
        },

        /**
         * Returns true, when the given key is currently pressed.
         * @param {String|Integer} keyName Either the keys name, or its key index.
         * @returns {boolean}
         */
        isPressed: function (keyName){
            if(typeof keyName === 'number'){
                keyName = keymap[keyName];
            }
            return pressed[keyName] === true;
        },

        /**
         * Removes a scope from the scopes list.
         * If it was the last submitted scope, the scope pointer will switch back to the previously submitted scope.
         * @param {modoCore.Element|String} oldScope
         */
        releaseScope: function (oldScope){
            var scopeIndex;

            scopeIndex = scopes.indexOf(oldScope.modoId || oldScope);

            if(scopeIndex !== -1){
                scopes.splice(scopeIndex, 1);
            }
        },

        /**
         * Wrapper function for the "on" method, to bind to scoped events.
         * Read more: http://backbonejs.org/#Events-on
         * @param {modoCore.Element|String} scope
         * @param {String} eventName
         * @param {Function} callback
         * @param {Object} [context]
         */
        onScoped: function (scope, eventName, callback, context){
            var scopeName,
                i;

            scopeName = scope.modoId || scope;

            eventName = eventName.split(' ');
            for (i = 0; i < eventName.length; i++) {
                eventName[i] = eventName[i] + ':' + scopeName;
            }
            eventName = eventName.join(' ');

            this.on(eventName, callback, context);
        },

        /**
         * Removes a previously bound callback from a scoped event.
         * Read more: http://backbonejs.org/#Events-off
         * @param {modoCore.Element|String} scope
         * @param {String} eventName
         * @param {Function} [callback]
         * @param {Object} [context]
         */
        offScoped: function (scope, eventName, callback, context){
            var scopeName,
                i;

            scopeName = scope.modoId || scope;

            eventName = eventName.split(' ');
            for (i = 0; i < eventName.length; i++) {
                eventName[i] = eventName[i] + ':' + scopeName;
            }
            eventName = eventName.join(' ');

            this.off(eventName, callback, context);
        }
    };

    var keymap;
    if(typeof modoCore.keyListener.keymap[navigator.language] !== 'undefined'){
        keymap = modoCore.keyListener.keymap[navigator.language];
    } else {
        keymap = modoCore.keyListener.keymap.en;
    }

    _.extend(modoCore.keyListener, Backbone.Events);

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.keyListener;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define(function (){
                return modoCore.keyListener;
            });
        }
    }
})();

/**
 * Template
 * ===========
 * The template element is a element that renders custom HTML parts of your interface, like static
 * descriptions or decoration.
 * You can still hook up a Backbone.Model to the template element to replace certain placeholders in the template
 * automatically.
 */
/* global modo:true */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    function cn(index, prefixed){
        if(prefixed !== undefined){
            return modoCore.Template.classNames[index];
        }
        return modoCore.cssPrefix + modoCore.Template.classNames[index];
    }

    function render(el, tpl, data){
        el.html(tpl(data));
    }

    modoCore.defineElement('Template', ['mdo-template'], function (params){
        var that;

        params = params || {};
        that = this;

        modoCore.Element.call(this, params);

        this.addClass(cn(0, true));

        if(typeof params.template !== 'function'){
            params.template = _.template(params.template);
        }


        if(params.data){
            this.set(params.data);
        } else {
        render(this.el, params.template, {});
        }

        //TODO: Clean that shit up.
        this.set = function (data){
            this.stopListening();

            if(data instanceof Backbone.Model){
                this.listenTo(data, 'change', function (){
                    render(that.el, params.template, data.getJSON());
                    that.trigger('update');
                });
                render(this.el, params.template, data.getJSON());
            } else {
                render(this.el, params.template, data);
            }

            this.trigger('update');

            return this;
        };
    })
        .inheritPrototype('Element')
        .extendPrototype({
            /* PROTOTYPE FUNCTIONS HERE */
        });

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modo.Template;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('Template', [], function (){
                return modo.Template;
            });
        }
    }
})();
/**
 * modo-notification
 * ===========
 * description
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    function cn(index, prefixed){
        if(prefixed !== undefined){
            return modoCore.Notification.classNames[index];
        }
        return modoCore.cssPrefix + modoCore.Notification.classNames[index];
    }

    modoCore.defineElement('Notification', ['notification'], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        this.addClass(cn(0, false));

        /**
         * Used as a marker for the modoCore.generate() function.
         * This states, that this element must not be passed to add() functions.
         * @type {Boolean}
         */
        this.noAdd = true;

        this.el.html(params.content);

        this.displayTime = params.duration;
    })
        .inheritPrototype('Element')
        .extendPrototype({
            set: function(content){
                this.el.html(content);

                return this;
            },
            hide: function(){
                this.visible = false;

                return this;
            }
        });

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modo.Notification;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('Notification', [], function (){
                return modo.Notification;
            });
        }
    }
})();
/**
 * modo-NotificationContainer
 * ===========
 * description
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    function cn(index, prefixed){
        if(prefixed !== undefined){
            return modoCore.NotificationContainer.classNames[index];
        }
        return modoCore.cssPrefix + modoCore.NotificationContainer.classNames[index];
    }

    modoCore.defineElement('NotificationContainer', ['notificationcontainer', 'pos-', 'append-'], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        this.addClass(cn(0, false));

        if(!params.position){
            params.position = 'top-right';
        }

        this.addClass(cn(1, false) + params.position);

        if(params.append !== 'before'){
            params.append = 'after';
        }

        this.addClass(cn(2, false) + params.append);

        var queue,
            active,
            maxActive,
            maxTime,
            that,
            showEffect,
            hideEffect;

        that = this;
        queue = [];
        active = [];
        maxActive = params.showLimit || Number.POSITIVE_INFINITY;
        maxTime = params.displayTime || 5000;
        showEffect = params.showEffect || function (elm){
            elm.slideDown();
        };
        hideEffect = params.hideEffect || function (elm){
            elm.slideUp();
        };

        modoCore.getRootElement().append(this.el);

        /**
         * Used as a marker for the modoCore.generate() function.
         * This states, that this element must not be passed to add() functions.
         * @type {Boolean}
         */
        this.noAdd = true;

        function update(){
            var n,
                i,
                now,
                removed;

            now = Date.now();
            removed = 0;

            while (queue.length && active.length < maxActive) {
                n = queue.shift();
                n.displayedAt = now;
                if(n.displayTime === undefined){
                    n.displayTime = maxTime;
                }
                n.el.hide();
                if(params.append === 'before'){
                    that.el.prepend(n.el);
                } else {
                    that.el.append(n.el);
                }
                showEffect(n.el);
                n.trigger('show');
                active.push(n);
            }

            for (i = 0; i < active.length; i++) {
                n = active[i];
                if(n.displayTime || !n.visible){
                    if(n.displayedAt + n.displayTime < now || !n.visible){
                        hideEffect(n.el);
                        n.trigger('hide');
                        that.trigger('remove', n);
                        active.splice(i, 1);
                        removed++;
                        i--;
                    }
                }
            }

            if(removed){
                update();
                return;
            }

            if(active.length || queue.length){
                setTimeout(update, 500);
            }

            if(!active.length && !queue.length){
                that.trigger('queueEmpty');
            }
        }

        /**
         * This method adds a new notification to the notifications stack.
         * @param elm
         */
        this.add = function (elm){
            if(!(elm instanceof modoCore.Notification)){
                throw new Error('You can only add elements of type modo.Notification');
            }
            queue.push(elm);

            that.trigger('add', elm);

            update();
        };
    })
        .inheritPrototype('Element')
        .extendPrototype({
            createNotification: function (params){
                var n;

                n = new modoCore.Notification(params);

                this.add(n);

                return n;
            }
        });

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modo.NotificationContainer;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('NotificationContainer', [], function (){
                return modo.NotificationContainer;
            });
        }
    }
})();
/**
 * Modo Slider
 * ===========
 * The slider element can be used to set up numeric values.
 * It has a horizontal and vertical direction.
 */
(function (){
    'use strict';

    var modoCore;

    //commonJS and AMD modularization - try to reach the core.
    if(typeof modo !== 'undefined'){
        modoCore = modo;
    } else {
        if(typeof require === 'function'){
            modoCore = require('modo');
        }
    }

    function cn(index, prefixed){
        if(prefixed !== undefined){
            return modoCore.Slider.classNames[index];
        }
        return modoCore.cssPrefix + modoCore.Slider.classNames[index];
    }

    modoCore.defineElement('Slider', ['slider', 'slider-vertical', 'slider-range', 'slider-value', 'slider-plug1', 'slider-plug2'], function (params){
        params = params || {};

        modoCore.Element.call(this, params);

        var that,
            settings,
            $uiValue,
            $uiPlug1,
            $uiPlug2,
            draggedPlug;

        that = this;
        settings = {
            direction: _.indexOf(['horizontal', 'vertical'], params.direction) !== -1 ? params.direction : 'horizontal',
            range: params.range ? true : false,
            minValue: params.minValue || 0,
            maxValue: params.maxValue || 100,
            value1: params.value || params.value1 || 0,
            value2: params.value2 || 0,
            step: params.step || 1
        };

        if(params.model){
            if(settings.range){
                params.modelKey = params.modelKey1;
            } else {
                params.value1 = params.value;
            }

            if(!params.modelKey){
                if(typeof params.value1 === 'function'){
                    params.model.on('change', function (){
                        that.set(params.value1.call(that, params.model));
                    });
                } else {
                    throw new Error('Trying to bind to model, but no modelKey and no valueFunction given');
                }
            } else {
                params.value1 = params.model.get(params.modelKey);

                params.model.on('change:' + params.modelKey, function (){
                    that.set(params.model.get(params.modelKey));
                });
            }

            if(settings.range){
                if(!params.modelKey2){
                    if(typeof params.value2 === 'function'){
                        params.model.on('change', function (){
                            that.set(params.value2.call(that, params.model));
                        });
                    } else {
                        throw new Error('Trying to bind to model, but no modelKey and no valueFunction given');
                    }
                } else {
                    params.value2 = params.model.get(params.modelKey2);

                    params.model.on('change:' + params.modelKey2, function (){
                        that.set(params.model.get(params.modelKey2));
                    });
                }
            }

        }

        $uiValue = $('<div class="' + cn(3) + '"></div>');
        $uiPlug1 = $('<div class="' + cn(4) + '"></div>');

        this.el.append($uiValue, $uiPlug1);

        this.disabled = false;

        this.addClass(cn(0, false));
        if(settings.direction === 'vertical'){
            this.addClass(cn(1, false));
        }

        if(settings.range){
            this.addClass(cn(2, false));
            $uiPlug2 = $('<div class="' + cn(5) + '"></div>');
            this.el.append($uiPlug2);
        }

        this.get = function (){
            if(settings.range){
                return [settings.value1, settings.value2];
            }
            return settings.value1;
        };

        this.set = function (values, options){
            options = options || {silent: false};

            if(settings.range){
                values.sort();
                settings.value1 = values[0];
                settings.value2 = values[1];
                return;
            }
            settings.value1 = values;

            update(options.silent);

            return this;
        };

        this.setMin = function (value){
            settings.minValue = value;

            return this;
        };

        this.setMax = function (value){
            settings.maxValue = value;

            return this;
        };

        /**
         * Updates the elements DOM nodes.
         */
        function update(silent){
            var p1Percent,
                p2Percent,
                vPercent,
                vPos,
                vert;

            vert = settings.direction === 'vertical';

            p1Percent = (settings.value1 - settings.minValue) / ((settings.maxValue - settings.minValue) / 100);

            if(settings.range){
                p2Percent = (settings.value2 - settings.minValue) / ((settings.maxValue - settings.minValue) / 100);

                vPos = p1Percent;
                vPercent = p2Percent - p1Percent;
                if(!vert){
                    $uiPlug2.css({
                        left: p2Percent + '%'
                    });
                } else {
                    $uiPlug2.css({
                        bottom: p2Percent + '%'
                    });
                }
                if(!silent){
                    that.trigger('change', [settings.value1, settings.value2]);
                }
                if(params.model){
                    if(params.modelKey){
                        params.model.set(params.modelKey, settings.value1);
                    }
                    if(params.modelKey2){
                        params.model.set(params.modelKey2, settings.value2);
                    }
                }
            } else {
                vPos = 0;
                vPercent = p1Percent;
                if(!silent){
                    that.trigger('change', settings.value1);
                }
                if(params.model){
                    if(params.modelKey){
                        params.model.set(params.modelKey, settings.value1);
                    }
                }
            }

            if(!vert){
                $uiValue.css({
                    left: vPos + '%',
                    width: vPercent + '%'
                });
                $uiPlug1.css({
                    left: p1Percent + '%'
                });
            } else {
                $uiValue.css({
                    bottom: vPos + '%',
                    height: vPercent + '%'
                });
                $uiPlug1.css({
                    bottom: p1Percent + '%'
                });
            }
        }

        update(true);

        function updateValue(plugNr, pos){
            var begin,
                end,
                v,
                vX,
                s;

            v = settings['value' + plugNr];

            if(settings.direction === 'horizontal'){
                begin = that.el.offset().left;
                end = that.el.width();
            } else {
                begin = that.el.offset().top;
                end = that.el.height();
            }

            if(pos < begin){
                pos = begin;
            }
            if(pos > end + begin){
                pos = end + begin;
            }

            if(settings.direction === 'vertical'){
                pos = (begin + end) - (pos - begin);
            }

            v = settings.minValue + ((pos - begin) / (end / 100)) * ((settings.maxValue - settings.minValue) / 100);

            v = Math.floor(v / settings.step) * settings.step;

            //Weird attempt to "fix" misbehaving floating point numbers.
            s = settings.step.toString().split('.');
            if(s.length > 1){
                vX = v.toString().split('.');
                if(vX.length > 1 && vX[1].length > s[1].length){
                    v = Number(vX[0] + '.' + vX[1].substr(0, s[1].length));
                }
            }

            if(v < settings.minValue){
                v = settings.minValue;
            }
            if(v > settings.maxValue){
                v = settings.maxValue;
            }

            if(settings.range){
                if(plugNr === 1 && settings.value2 < v){
                    vX = settings.value2;
                    settings.value2 = v;
                    settings.value1 = vX;
                    draggedPlug = plugNr = 2;
                }

                if(plugNr === 2 && settings.value1 > v){
                    vX = settings.value1;
                    settings.value1 = v;
                    settings.value2 = vX;
                    draggedPlug = plugNr = 1;
                }
            }

            settings['value' + plugNr] = v;

            update();
        }

        function mouseMove(e){
            stop(e);
            updateValue(draggedPlug, settings.direction === 'horizontal' ? e.clientX : e.clientY);
        }

        function mouseUp(){
            $(document).off('mousemove', mouseMove).off('mouseup', mouseUp);
        }

        function stop(e){
            e.preventDefault();
            e.stopPropagation();
        }

        this.el.on('mousedown', '.' + cn(4) + ',.' + cn(5), function (e){
            var $this;

            stop(e);

            if(that.disabled){
                return;
            }

            $this = $(this);

            $(document).on('mousemove', mouseMove).on('mouseup', mouseUp);

            draggedPlug = $this.hasClass(cn(4)) ? 1 : 2;
        });
    })
        .inheritPrototype('Element')
        .extendPrototype({
            /* PROTOTYPE FUNCTIONS HERE */
            disable: function (){
                this.addClass(modo.Element.classNames[2]);
                this.disabled = true;
                this.trigger('disabled');
                return this;
            },

            enable: function (){
                this.removeClass(modo.Element.classNames[2]);
                this.disabled = false;
                this.trigger('enabled');
                return this;
            }
        });

    if(typeof exports !== 'undefined'){
        //commonJS modularization
        exports = modoCore.Slider;
    } else {
        if(typeof define === 'function'){
            //AMD modularization
            define('modo-slider', [], function (){
                return modoCore.Slider;
            });
        }
    }
})();