/**
 * UI base
 * =======
 * This generates the basic app UI structure to initialize the app with.
 */
'use strict';

define(['central'], function (central){
    var ui,
        gui,
        historyItems,
        historyMenu;

    gui = nodeRequire('nw.gui');

    ui = modo.generate([
        {
            type: 'Container',
            ref: 'root',
            params: {
                className: 'serverControl'
            },
            children: [
                {
                    type: 'Image',
                    params: {
                        className: 'artwork',
                        value: 'lib/img/warp-artwork.png'
                    }
                },
                {
                    type: 'Label',
                    params: {
                        className: 'version',
                        value: 'You are running at Warp 1'
                    }
                },
                {
                    type: 'Button',
                    ref: 'btnBrowse',
                    params: {
                        className: 'btnBrowse',
                        label: 'Open Directory',
                        tooltip: 'Choose which folder to serve'
                    },
                    on: {
                        click: function (){
                            ui.inpFolder.el.trigger('click');
                        }
                    }
                },
                {
                    type: 'Button',
                    ref: 'btnHistory',
                    disabled: true,
                    params: {
                        className: 'btnHistory',
                        tool: 'Pick a previously served folder',
                        label: '▾'
                    },
                    on: {
                        click: function (){
                            var pos;

                            pos = this.el.offset();

                            historyMenu.popup(pos.left, pos.top + this.el.height());
                        }
                    }
                },
                {
                    type: 'Button',
                    ref: 'btnStart',
                    disabled: true,
                    params: {
                        className: 'btnStart',
                        label: 'Start',
                        tooltip: 'Start serving the selected folder to browsers'
                    },
                    on: {
                        click: function (){
                            central.start();
                        }
                    }
                },
                {
                    type: 'Button',
                    ref: 'btnStop',
                    params: {
                        className: 'btnStop',
                        label: 'Stop',
                        tooltip: 'Stop serving the selected folder'
                    },
                    on: {
                        click: function (){
                            central.stop();
                        }
                    },
                    hidden: true
                },
                {
                    type: 'Label',
                    ref: 'lblStatus',
                    params: {
                        className: 'lblStatus',
                        model: central,
                        value: function (){
                            var dir;

                            dir = central.get('rootDir');

                            if(dir){
                                this.set('<b>Serving Folder:</b><br>' + central.get('rootDir'));
                            } else {
                                this.set('Please select a directory');
                            }
                        }
                    }
                },

                {
                    type: 'InputText',
                    ref: 'inpFolder',
                    params: {
                        type: 'file'
                    },
                    hidden: true
                }
            ]
        }
    ]);

    historyMenu = new gui.Menu();
    historyItems = JSON.parse(localStorage.getItem('history'));

    if(!historyItems){
        historyItems = [];
    }

    //Render existing history items for the first time.
    (function (){
        var i;

        for (i = 0; i < historyItems.length; i++) {
            addHistoryItem(historyItems[i], true);
        }
    })();

    function addHistoryItem(path, dontAdd){
        var item;

        if(!dontAdd){
            historyItems.push(path);
            if(historyItems.length > 5){
                historyItems.shift();
                historyMenu.removeAt(0);
            }
            localStorage.setItem('history', JSON.stringify(historyItems));
        }

        item = new gui.MenuItem({
            label: path,
            click: function (){
                central.set('rootDir', this.path);
            }
        });

        item.path = path;

        historyMenu.append(item);

        ui.btnHistory.enable();
    }

    central.on('change:rootDir', function (){
        ui.btnStart.enable();
        if(historyItems.indexOf(central.get('rootDir')) === -1){
            addHistoryItem(central.get('rootDir'));
        }
    });

    ui.inpFolder.el.attr('nwdirectory', true);

    ui.inpFolder.el.on('change', function (){
        central.set('rootDir', $(this).val());
    });

    central.on('start', function (){
        ui.btnBrowse.hide();
        ui.btnHistory.hide();
        ui.btnStart.hide();
        ui.btnStop.show();
    });

    central.on('stop', function (){
        ui.btnStop.hide();
        ui.btnBrowse.show();
        ui.btnHistory.show();
        ui.btnStart.show();
    });

    return ui;
});