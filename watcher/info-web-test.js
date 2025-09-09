// System dark/light detection without Window access
// ERROR: This approach doesn't work as loading an SVG image doesn't seem to be available without DOM and/or access to a main window to transfer the image data.
// - see: https://github.com/whatwg/html/pull/10172
// A possible alternative, the `Sec-CH-Prefers-Color-Scheme` ("dark"/"light") client hint, requires an HTTPS server to respond with `Accept-CH: Sec-CH-Prefers-Color-Scheme`.
class ThemeDetector {
    constructor() {
        this.previousTheme = null;
        this.reactThemeChange = this.reactThemeChange.bind(this);
    }

    static async loadImg(svg) {

        // Update image source URL
        if (!this.imgSrc) {
            this.imgSrc = 'data:image/svg+xml;base64,' + btoa(svg);
        }

        // Note: Image() requires direct DOM access and/or a main window to transfer the image data.
        if (typeof Image !== 'undefined') {
            const img = new Image();
            const imgPromise = new Promise((resolve, reject) => {
                img.onload = () => {
                    resolve(img);
                };
                img.onerror = (err) => {
                    reject(err);
                };
            });
            img.src = this.imgSrc;
            await imgPromise;
            return img;
        }

        // Otherwise, attempt to create an image via a blob
        let blob;
        if (1) {
            blob = new Blob([svg], { type: "image/svg+xml" });
        } else {
            // Using a fetch()
            //this.imgSrc = 'info-web-test.bmp';    // HACK: Testing .BMP works (while an .SVG doesn't)
            const response = await fetch(this.imgSrc);
            blob = await response.blob(); 
        }

        // Create an image from the blob
        // ERROR: Loading an .SVG via a blob fails (at least in a WebWorker)
        // - see: https://github.com/whatwg/html/pull/10172
        const imageBitmap = await createImageBitmap(blob);
        return imageBitmap;
    }

    async isDarkMode() {
        // TODO: Move as much as possible to the constructor
        // Initial values
        this.size = 1;
        // An SVG image containing an HTML foreignObject with light/dark sensitive contentß
        // <svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><style>@media not (prefers-color-scheme: dark) { rect { fill: white; } }</style><rect width="1" height="1" /></svg>
        this.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.size}" height="${this.size}">
            <style>
                rect { fill: #fff; }
                @media (prefers-color-scheme: dark) {
                    rect { fill: #000; }
                }
            </style>
            <rect width="${this.size}" height="${this.size}" />
            <!--
            <foreignObject width="${this.size}" height="${this.size}">
                <div xmlns="http://www.w3.org/1999/xhtml" style="color-scheme: light dark; position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 0; margin: 0; background-color: light-dark(white, black);"></div>
            </foreignObject>
            -->
            <!-- cacheBuster=0 -->
        </svg>`;

        // Note: cache busting appears to be required in, e.g. Firefox, but not in, e.g. Chrome.
        if (!/Chrome/.test(navigator.userAgent)) {
            this.svg = this.svg.replace(/cacheBuster=\d*/g, `cacheBuster=${(new Date()).getTime()}`);
            this.imgSrc = null;
        }

        // HACK: Try using a local file instead of a data URL (must not be cross-origin to avoid tainting the canvas which prevents reading pixel data)
        //this.imgSrc = './info-web-test.svg' + (!/Chrome/.test(navigator.userAgent) ? `?cacheBuster=${(new Date()).getTime()}` : '');

        // Create OffscreenCanvas
        const canvas = new OffscreenCanvas(this.size, this.size);
        this.ctx = canvas.getContext('2d');
        this.ctx.fillStyle = '#808080';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Load the theme-sensitive SVG
        let img = null;
        try {
            img = await ThemeDetector.loadImg(this.svg);
        } catch (err) {
            console.error('ThemeDetector: Error loading image - ' + err.message);
            return null;
        }

        // Draw the image
        this.ctx.drawImage(img, 0, 0);

        // Read pixel from canvas
        try {
            const data = this.ctx.getImageData(Math.floor(this.ctx.canvas.width / 2), Math.floor(this.ctx.canvas.height / 2), 1, 1).data;
            const average = (data[0] + data[1] + data[2]) / 3;  // const alpha = data[3];
            return average < 128;
        } catch (err) {
            console.error('ThemeDetector: Error reading image - ' + err.message);
            return null;
        }
    }

    async checkThemeChange() {
        const currentTheme = await this.isDarkMode();
        if (this.previousTheme !== currentTheme) {
            this.previousTheme = currentTheme;
            return currentTheme;
        }
        return null;
    };

    async reactThemeChange() {
        const themeChange = await this.checkThemeChange();
        if (themeChange !== null) {
            if (this.callback) {
                this.callback(themeChange === null ? null : (themeChange ? 0 : 1), this.reference); // 0=dark, 1=light
            }
        }
    }

    async startWatching(callback, interval = 1000, reference) {
        this.stopWatching();
        this.callback = callback;
        this.reference = reference;
        await this.reactThemeChange();
        this.intervalId = setInterval(this.reactThemeChange, interval);
    }

    stopWatching() {
        this.callback = null;
        this.reference = null;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

// If in a WebWorker, use messages to communicate
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    // Wait for message to start detecting
    onmessage = (e) => {
        console.log("ThemeDetector: Message received from main script: " + JSON.stringify(e.data));

        // Callback via postMessage
        const themeDetector = new ThemeDetector();
        themeDetector.startWatching((value) => {    // 0=dark, 1=light
            //const message = 'ThemeDetector: Background detected: ' + (value ? 'light' : 'dark');
            //console.log(message);
            //document.querySelector('body').innerText = message;
            postMessage(value);
        }, 1000);
    };
}

// Hack to export only if imported as a module (top-level await a regexp divided, otherwise an undefined variable divided followed by a comment)
if(0)typeof await/0//0; export default ThemeDetector
