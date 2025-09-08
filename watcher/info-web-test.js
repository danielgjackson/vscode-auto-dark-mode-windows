// System dark/light detection without Window access
// ERROR: This approach doesn't work as creating an SVG image doesn't seem to be available without DOM and/or access to a main window to transfer the image data.
// - see: https://github.com/whatwg/html/pull/10172
class ThemeDetector {
    constructor() {
        this.previousTheme = null;
        this.reactThemeChange = this.reactThemeChange.bind(this);
    }

    static async loadImg(src) {
        // Attempt to load image using fetch + createImageBitmap
        const response = await fetch(src);
        const blob = await response.blob();
        // ERROR: This loading an .SVG via a blob fails in a WebWorker (yet a .BMP works)
        // - see: https://github.com/whatwg/html/pull/10172
        const imageBitmap = await createImageBitmap(blob);
        return imageBitmap;

        /*
        // ERROR: Image() requires DOM and/or access to a main window to transfer the image data.
        const img = new Image();
        const imgPromise = new Promise((resolve, reject) => {
            img.onload = () => {
                resolve(img);
            };
            img.onerror = (err) => {
                reject(err);
            };
        });
        img.src = src;
        await imgPromise;
        return img;
        */
    }

    async isDarkMode() {
        // Initial values
        this.size = 1;
        // An SVG image containing an HTML foreignObject with light/dark sensitive content
        this.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.size}" height="${this.size}">
            <foreignObject width="${this.size}" height="${this.size}">
                <div xmlns="http://www.w3.org/1999/xhtml" style="color-scheme: light dark; position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 0; margin: 0; background-color: light-dark(white, black);"></div>
            </foreignObject>
            <!-- cacheBuster=${(new Date()).getTime()} -->
        </svg>`;
        this.imgSrc = 'data:image/svg+xml;base64,' + btoa(this.svg);

// HACK: Try using a local file instead
//this.imgSrc = './info-web-test.svg'; // + `?cacheBuster=${(new Date()).getTime()}`;

        // Create OffscreenCanvas
        const canvas = new OffscreenCanvas(this.size, this.size);
        this.ctx = canvas.getContext('2d');
        this.ctx.fillStyle = '#808080';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Load SVG image as HTML 
        let img = null;
        try {
            img = await ThemeDetector.loadImg(this.imgSrc);
            this.ctx.drawImage(img, 0, 0);

            // Read pixel from canvas
            const data = this.ctx.getImageData(Math.floor(this.ctx.canvas.width / 2), Math.floor(this.ctx.canvas.height / 2), 1, 1).data;
            const average = (data[0] + data[1] + data[2]) / 3;  // const alpha = data[3];
            return average < 128;
        } catch (err) {
            console.error('ThemeDetector: Error loading image - ' + err.message);
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
                this.callback(themeChange === null ? null : (themeChange ? 0 : 1)); // 0=dark, 1=light
            }
        }
    }

    async startWatching(callback, interval = 1000) {
        this.stopWatching();
        this.callback = callback;
        await this.reactThemeChange();
        this.intervalId = setInterval(this.reactThemeChange, interval);
    }

    stopWatching() {
        this.callback = null;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}


// Wait for message to start detecting
onmessage = (e) => {
    console.log("ThemeDetector: Message received from main script: " + JSON.stringify(e.data));

    // Callback via postMessage
    const themeDetector = new ThemeDetector();
    themeDetector.startWatching((value) => {    // 0=dark, 1=light
        const message = 'ThemeDetector: Background detected: ' + (value ? 'light' : 'dark');
        console.log(message);
        //document.querySelector('body').innerText = message;
        postMessage(value);
    }, 1000);
};
