
// not included in lib.d.ts
declare function escape(s: string): any;
declare function unescape(s: string): any;

interface HTMLElement{
    ontouchstart: any;
}

interface StringExtensions {
    b64_to_utf8(str: string): string;
    contains(str: string): boolean;
    endsWith(text: string): boolean;
    format(template: string, ...args: any[]): string;
    fulltrim(): string;
    ltrim(): string;
    rtrim(): string;
    startsWith(text: string): boolean;
    toCssClass(): string;
    toFileName(): string;
    trim(): string;
    utf8_to_b64(str: string): string;
}

interface String extends StringExtensions {}
interface StringConstructor extends StringExtensions {}

interface ArrayExtensions{
    clone(): any[];
    contains(val: any): boolean;
    indexOf(searchElement: any, fromIndex?: number): number;
    indexOfTest(test: (element: any) => boolean, fromIndex?: number): number;
    last(): any;
    move(fromIndex: number, toIndex: number): void;
}

interface Array<T> extends ArrayExtensions{}
interface ArrayConstructor extends ArrayExtensions{}

interface JQuery {
    // plugins
    disable(): void;
    ellipsisFill(text?: string): any;
    enable(): void;
    equaliseHeight(reset?: boolean): any;
    horizontalMargins(): number;
    horizontalPadding(): number;
    ismouseover(): boolean;
    onEnter(callback: () => void): any;
    onPressed(callback: () => void): any;
    swapClass(removeClass: string, addClass: string): void;
    targetBlank(): void;
    toggleExpandText(chars: number, callback?: () => void);
    verticalMargins(): number;
    verticalPadding(): number;

    // jsviews
    link: any;
    render: any;

    // unevent
    on(events: string, handler: (eventObject: JQueryEventObject, ...args: any[]) => any, wait: Number): JQuery;
}

interface JQueryStatic {
    // pubsub
    disposePubSub();
    initPubSub();
    publish(event: string, eventObj?: any[]);
    subscribe(event: string, handler: Function);
    unsubscribe(event: string);

    cookie(name: string);

    // jsviews
    observable: any;
    templates: any;
    views: any;
    view: any;
}

// libs
declare var easyXDM: any;
declare var MediaElementPlayer: any;
declare var OpenSeadragon: any;
declare var PDFJS: any;
declare var PDFObject: any;
declare var Sanitize: any;
declare var yepnope: any;

// app
interface Window{
    $: any;
    _: any;
    browserDetect: any;
    DEBUG: boolean;
    IEXMLHttpRequest: any;
    manifestCallback: any;
    openSeadragonViewer: any; // for testing convenience
    trackEvent(category: string, action: string, label: string, value?: any);
    trackVariable(slot: number, name: string, value: string, scope: number);
    webViewerLoad: any; // pdfjs
}

// google
declare function trackEvent(category: string, action: string, label: string, value?: any): void;