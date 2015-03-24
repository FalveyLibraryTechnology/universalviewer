/// <reference path="../../js/jquery.d.ts" />
/// <reference path="../../js/extensions.d.ts" />
import utils = require("../../utils");
import baseProvider = require("./baseProvider");
import shell = require("./shell");
import genericDialogue = require("./genericDialogue");
import IProvider = require("./iProvider");
import IExtension = require("./iExtension");

export class BaseExtension implements IExtension {

    shell: shell.Shell;
    isFullScreen: boolean = false;
    canvasIndex: number;
    mouseX: number;
    mouseY: number;
    tabbing: boolean = false;
    shifted: boolean = false;
    $element: JQuery;
    extensions: any;
    socket: any;
    provider: IProvider;

    // events
    static SETTINGS_CHANGED: string = 'onSettingsChanged';
    static LOAD: string = 'onLoad';
    static RESIZE: string = 'onResize';
    static TOGGLE_FULLSCREEN: string = 'onToggleFullScreen';
    static CANVAS_INDEX_CHANGED: string = 'onAssetIndexChanged';
    static CANVAS_INDEX_CHANGE_FAILED: string = 'onAssetIndexChangeFailed';
    static CLOSE_ACTIVE_DIALOGUE: string = 'onCloseActiveDialogue';
    static SEQUENCE_INDEX_CHANGED: string = 'onSequenceIndexChanged';
    static REDIRECT: string = 'onRedirect';
    static REFRESH: string = 'onRefresh';
    static RELOAD_MANIFEST: string = 'onReloadManifest';
    static ESCAPE: string = 'onEscape';
    static RETURN: string = 'onReturn';
    static PAGE_UP: string = 'onPageUp';
    static PAGE_DOWN: string = 'onPageDown';
    static HOME: string = 'onHome';
    static END: string = 'onEnd';
    static WINDOW_UNLOAD: string = 'onWindowUnload';
    static OPEN_MEDIA: string = 'onOpenMedia';
    static CREATED: string = 'onCreated';
    static SHOW_MESSAGE: string = 'onShowMessage';
    static HIDE_MESSAGE: string = 'onHideMessage';

    constructor(provider: IProvider) {

        window.extension = this;

        this.provider = provider;

        this.create();
    }

    create(): void {

        this.$element = $('#app');

        // initial sizing.
        var $win = $(window);
        this.$element.width($win.width());
        this.$element.height($win.height());

        if (!this.provider.isReload){
            // communication with parent frame.
            this.socket = new easyXDM.Socket({
                onMessage: (message, origin) => {
                    message = $.parseJSON(message);
                    this.handleParentFrameEvent(message);
                }
            });
        }

        this.triggerSocket(BaseExtension.LOAD, {
            config: this.provider.config
        });

        // add/remove classes.
        this.$element.empty();
        this.$element.removeClass();
        this.$element.addClass('browser-' + window.browserDetect.browser);
        this.$element.addClass('browser-version-' + window.browserDetect.version);
        if (!this.provider.isHomeDomain) this.$element.addClass('embedded');
        if (this.provider.isLightbox) this.$element.addClass('lightbox');
        this.$element.addClass(this.provider.getSequenceType());

        // events.
        window.onresize = () => {

            var $win = $(window);
            $('body').height($win.height());

            this.resize();
        }

        $(document).on('mousemove', (e) => {
            this.mouseX = e.pageX;
            this.mouseY = e.pageY;
        });

        $(document).on('keyup keydown', (e) => {
            this.shifted = e.shiftKey;
            this.tabbing = e.keyCode === 9;
        });

        this.$element.append('<a href="/" id="top"></a>');

        $.subscribe(BaseExtension.TOGGLE_FULLSCREEN, () => {
            if (!this.isOverlayActive()){
                $('#top').focus();
                this.isFullScreen = !this.isFullScreen;
                this.triggerSocket(BaseExtension.TOGGLE_FULLSCREEN,
                    {
                        isFullScreen: this.isFullScreen,
                        overrideFullScreen: this.provider.config.options.overrideFullScreen
                    });
            }
        });

        // keyboard events.
        $(document).keyup((e) => {
            if (e.keyCode === 13) $.publish(BaseExtension.RETURN);
            if (e.keyCode === 27) $.publish(BaseExtension.ESCAPE);
            if (e.keyCode === 33) $.publish(BaseExtension.PAGE_UP);
            if (e.keyCode === 34) $.publish(BaseExtension.PAGE_DOWN);
            if (e.keyCode === 35) $.publish(BaseExtension.END);
            if (e.keyCode === 36) $.publish(BaseExtension.HOME);
        });

        $.subscribe(BaseExtension.ESCAPE, () => {
            if (this.isFullScreen) {
                $.publish(BaseExtension.TOGGLE_FULLSCREEN);
            }
        });

        $.subscribe(BaseExtension.CREATED, () => {
            this.triggerSocket(BaseExtension.CREATED);
        });

        // create shell and shared views.
        this.shell = new shell.Shell(this.$element);

        // set canvasIndex to -1 (nothing selected yet).
        this.canvasIndex = -1;
    }

    width(): number {
        return $(window).width();
    }

    height(): number {
        return $(window).height();
    }

    triggerSocket(eventName: string, eventObject?: any): void {
        if (this.socket) {
            this.socket.postMessage(window.JSON.stringify({ eventName: eventName, eventObject: eventObject }));
        }
    }

    redirect(uri: string): void {
        this.triggerSocket(BaseExtension.REDIRECT, uri);
    }

    refresh(): void {
        this.triggerSocket(BaseExtension.REFRESH, null);
    }

    resize(): void {
        $.publish(BaseExtension.RESIZE);
    }

    handleParentFrameEvent(message): void {
        // todo: come up with better way of postponing this until viewer is fully created
        setTimeout(() => {
            switch (message.eventName) {
                case BaseExtension.TOGGLE_FULLSCREEN:
                    $.publish(BaseExtension.TOGGLE_FULLSCREEN, message.eventObject);
                    break;
            }
        }, 1000);
    }

    // get hash or data-attribute params depending on whether the player is embedded.
    getParam(key: baseProvider.params): any{
        var value;

        // deep linking is only allowed when hosted on home domain.
        if (this.provider.isDeepLinkingEnabled()){
            value = utils.Utils.getHashParameter(this.provider.paramMap[key], parent.document);
        }

        if (!value){
            value = utils.Utils.getQuerystringParameter(this.provider.paramMap[key]);
        }

        return value;
    }

    // set hash params depending on whether the player is embedded.
    setParam(key: baseProvider.params, value: any): void{

        if (this.provider.isDeepLinkingEnabled()){
            utils.Utils.setHashParameter(this.provider.paramMap[key], value, parent.document);
        }
    }

    viewCanvas(canvasIndex: number, callback?: (i: number) => any): void {

        this.provider.canvasIndex = canvasIndex;

        $.publish(BaseExtension.CANVAS_INDEX_CHANGED, [canvasIndex]);

        if (callback) callback(canvasIndex);
    }

    showDialogue(message: string, acceptCallback?: any, buttonText?: string, allowClose?: boolean): void {

        this.closeActiveDialogue();

        $.publish(genericDialogue.GenericDialogue.SHOW_GENERIC_DIALOGUE, [
            {
                message: message,
                acceptCallback: acceptCallback,
                buttonText: buttonText,
                allowClose: allowClose
            }]);
    }

    closeActiveDialogue(): void{
        $.publish(BaseExtension.CLOSE_ACTIVE_DIALOGUE);
    }

    isOverlayActive(): boolean{
        return shell.Shell.$overlays.is(':visible');
    }

    viewManifest(manifest: any): void{
        var seeAlsoUri = this.provider.getManifestSeeAlsoUri(manifest);
        if (seeAlsoUri){
            window.open(seeAlsoUri, '_blank');
        } else {
            if (this.isFullScreen) {
                $.publish(BaseExtension.TOGGLE_FULLSCREEN);
            }

            this.triggerSocket(BaseExtension.SEQUENCE_INDEX_CHANGED, manifest.assetSequence);
        }
    }
}
