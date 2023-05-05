import task = require('azure-pipelines-task-lib/task');
import fs = require('fs');
import PImage = require('pureimage');
import path = require('path');
import { Bitmap } from 'pureimage/types/bitmap';
import internal = require('stream');
import { DOMParser, XMLSerializer } from 'xmldom';

class IconOptions {
    color: string;
    textColor: string;
    text: string;

    constructor(color: string,
        textColor: string,
        text: string) {
        this.color = color;
        this.textColor = textColor;
        this.text = text;
    }
}

enum BannerVersionNamePosition {
    BottomRight,
    BottomLeft,
    TopLeft,
    TopRight,
}

async function run() {
    try {
        let contents: string[] = task.getDelimitedInput('contents', '\n', true);

        let sourceFolder: string = task.getPathInput('sourceFolder', false, true);
        // This part of code is from the copy folder task. More info here: https://github.com/microsoft/azure-pipelines-tasks/tree/master/Tasks/CopyFilesV2
        // normalize the source folder path. this is important for later in order to accurately
        // determine the relative path of each found file (substring using sourceFolder.length).
        sourceFolder = path.normalize(sourceFolder);
        let allPaths: string[] = task.find(sourceFolder); // default find options (follow sym links)
        let sourceFolderPattern = sourceFolder.replace('[', '[[]'); // directories can have [] in them, and they have special meanings as a pattern, so escape them
        let matchedPaths: string[] = task.match(allPaths, contents, sourceFolderPattern); // default match options
        let matchedFiles: string[] = matchedPaths.filter((itemPath: string) => !task.stats(itemPath).isDirectory()); // filter-out directories
        // copy the files to the target folder

        if (matchedFiles != null) {
            let bannerVersionNamePosition = task.getInput('bannerVersionNamePosition', true);
            let bannerVersionNumberPosition = task.getInput('bannerVersionNumberPosition', false);

            let bannerVersionNameColor = task.getInput('bannerVersionNameColor');
            let bannerVersionNameTextColor = task.getInput('bannerVersionNameTextColor');
            let bannerVersionNameText = task.getInput('bannerVersionNameText');

            let bannerVersionNumberColor = task.getInput('bannerVersionNumberColor');
            let bannerVersionNumberTextColor = task.getInput('bannerVersionNumberTextColor');
            let bannerVersionNumberText = task.getInput('bannerVersionNumberText');

            let iconHeaderOptions = new IconOptions(bannerVersionNumberColor, bannerVersionNumberTextColor, bannerVersionNumberText);
            let iconHeadbannerOptions = new IconOptions(bannerVersionNameColor, bannerVersionNameTextColor, bannerVersionNameText);

            let font = PImage.registerFont(path.join('font/Roboto-Bold.ttf'), 'Roboto Bold', 400, 'normal', 'latin');

            await font.load(async () => {
                for (let index = 0; index < matchedFiles.length; index++) {
                    await generate(matchedFiles[index], bannerVersionNamePosition, bannerVersionNumberPosition, iconHeaderOptions, iconHeadbannerOptions);
                }
            });
        }

        task.setResult(task.TaskResult.Succeeded, "Banners generation succeeded");
    }
    catch (err) {
        console.log(err);
        task.setResult(task.TaskResult.Failed, err);
    }
}

function GetBitmap(img: Bitmap, headerBannerPosition: string, headerPosition: string, iconHeaderOptions: IconOptions,
    iconHeadbannerOptions: IconOptions) {
    let ctx = img.getContext('2d') as unknown as CanvasRenderingContext2D;
    let x = img.height;
    let y = img.width;

    switch (headerBannerPosition) {
        case 'bottomRight':
            drawHeadbannerRight(ctx, x, y, iconHeadbannerOptions.color, false);
            drawText(ctx, x, y, iconHeadbannerOptions.text, iconHeadbannerOptions.textColor, BannerVersionNamePosition.BottomRight);
            break;
        case 'bottomLeft':
            drawHeadbannerLeft(ctx, x, y, iconHeadbannerOptions.color, false);
            drawText(ctx, x, y, iconHeadbannerOptions.text, iconHeadbannerOptions.textColor, BannerVersionNamePosition.BottomLeft);
            break;
        case 'topLeft':
            drawHeadbannerLeft(ctx, x, y, iconHeadbannerOptions.color, true);
            drawText(ctx, x, y, iconHeadbannerOptions.text, iconHeadbannerOptions.textColor, BannerVersionNamePosition.TopLeft);
            break;
        case 'topRight':
            drawHeadbannerRight(ctx, x, y, iconHeadbannerOptions.color, true);
            drawText(ctx, x, y, iconHeadbannerOptions.text, iconHeadbannerOptions.textColor, BannerVersionNamePosition.TopRight);
            break;
        default:
            // None
            break;
    }

    if (headerPosition != 'none') {
        drawVersionheader(ctx, x, y, headerPosition, iconHeaderOptions);
    }

    return img;
}

function processImage(imagePath: string, headerBannerPosition: string, headerPosition: string, iconHeaderOptions: IconOptions,
    iconHeadbannerOptions: IconOptions, decodeFn: (stream: NodeJS.ReadableStream) => Promise<Bitmap>, encodeFn: (img: Bitmap, stream: internal.Stream) => Promise<void>): Promise<void> {
    return decodeFn(fs.createReadStream(imagePath)).then((img) => {
        img = GetBitmap(img, headerBannerPosition, headerPosition, iconHeaderOptions, iconHeadbannerOptions);
        return encodeFn(img, fs.createWriteStream(imagePath + "1.png"));
    }).then(() => {
        console.log("Edition succeeded for: " + imagePath);
    });
}

async function generate(imagePath: string, headerBannerPosition: string, headerPosition: string, iconHeaderOptions: IconOptions, iconHeadbannerOptions: IconOptions) {
    if (imagePath.endsWith(".png")) {
        return processImage(imagePath, headerBannerPosition, headerPosition, iconHeaderOptions, iconHeadbannerOptions, PImage.decodePNGFromStream, PImage.encodePNGToStream);
    } else if (imagePath.endsWith(".jpg") || imagePath.endsWith(".jpeg")) {
        return processImage(imagePath, headerBannerPosition, headerPosition, iconHeaderOptions, iconHeadbannerOptions, PImage.decodeJPEGFromStream, PImage.encodeJPEGToStream);
    } else if (imagePath.endsWith(".svg")) {
        writeTextOnSvgImage(imagePath, headerBannerPosition, headerPosition, iconHeaderOptions, iconHeadbannerOptions, imagePath + 'output.svg')
            .then(() => console.log("Edition succeeded for: " + imagePath))
            .catch((error) => console.error(`Error generating image: ${error}`));

    }
}

function writeTextOnSvgImage(filePath: string, headerBannerPosition: string, headerPosition: string, iconHeaderOptions: IconOptions, iconHeadbannerOptions: IconOptions, outputFilePath: string): Promise<void> {
    // Read the SVG file from the specified path
    const svgString = fs.readFileSync(filePath, 'utf-8');

    // Parse the SVG string into an XML document
    const svgDoc = new DOMParser().parseFromString(svgString, 'text/xml');
    const svgWidth = svgDoc.documentElement.getAttribute('width');
    const svgHeight = svgDoc.documentElement.getAttribute('height');
    const wb = 24 * Math.max(iconHeadbannerOptions.text.length-5, 5);
    const hb = 24;
    const textElem = svgDoc.createElement('text');
    const rectElem = svgDoc.createElement('rect');

    // Create a new g element to contain the background and text elements
    const gElem = svgDoc.createElement('g');
    let w = 0;
    switch (headerBannerPosition) {
        case 'bottomRight':
            textElem.setAttribute('x', String(wb / 2 - hb / 2));
            textElem.setAttribute('y', String(hb / 2));
            textElem.setAttribute('text-anchor', 'middle');
            textElem.setAttribute('dominant-baseline', 'central');
            rectElem.setAttribute('x', String(0));
            rectElem.setAttribute('y', String(0));            
            w = svgWidth - Math.sqrt(wb * wb / 2) + hb;
            gElem.setAttribute('transform', `translate(${w}, ${svgHeight}) rotate(-45)`);
            break;
        case 'bottomLeft':
            textElem.setAttribute('x', String(wb / 2 - hb / 2));
            textElem.setAttribute('y', String(hb / 2));
            textElem.setAttribute('text-anchor', 'middle');
            textElem.setAttribute('dominant-baseline', 'central');
            rectElem.setAttribute('x', String(0));
            rectElem.setAttribute('y', String(0));
            w = svgHeight - Math.sqrt(wb * wb / 2) + hb/2;
            gElem.setAttribute('transform', `translate(0, ${w}) rotate(45)`);
            break;
        case 'topLeft':
            textElem.setAttribute('x', String(wb / 2 - hb / 2));
            textElem.setAttribute('y', String(hb / 2));
            textElem.setAttribute('text-anchor', 'middle');
            textElem.setAttribute('dominant-baseline', 'central');
            rectElem.setAttribute('x', String(0));
            rectElem.setAttribute('y', String(0));
            w = Math.sqrt(wb * wb / 2) - hb / 2;
            gElem.setAttribute('transform', `translate(${-hb}, ${w}) rotate(-45)`);
            break;
        case 'topRight':
            textElem.setAttribute('x', String(wb / 2));
            textElem.setAttribute('y', String(hb / 2));
            textElem.setAttribute('text-anchor', 'middle');
            textElem.setAttribute('dominant-baseline', 'central');
            rectElem.setAttribute('x', String(0));
            rectElem.setAttribute('y', String(0));
            w = svgWidth - Math.sqrt(wb * wb / 2) + hb;
            gElem.setAttribute('transform', `translate(${w}, ${-hb}) rotate(45)`);
            break;
        default:
            // None
            break;
    }

    textElem.setAttribute('font-size', String(hb));
    textElem.setAttribute('fill', iconHeadbannerOptions.textColor);

    // Create a text node with the specified text and append it to the text element
    const textNode = svgDoc.createTextNode(iconHeadbannerOptions.text);
    textElem.appendChild(textNode);

    // Create a rectangle element for the background
    rectElem.setAttribute('width', wb); // Set the width to the width of the text element
    rectElem.setAttribute('height', hb); // Set the height to the height of the text element
    rectElem.setAttribute('fill', iconHeadbannerOptions.color);

    // Append the rectangle element to the new g element
    gElem.appendChild(rectElem);

    // Append the text element to the new g element
    gElem.appendChild(textElem);

    // Append the text element to the SVG document
    svgDoc.documentElement.appendChild(gElem);

    // Create a new text element and set its attributes
    if (headerPosition != 'none') {
        const textElem = svgDoc.createElement('text');
        const rectElem = svgDoc.createElement('rect');
        const w = 24 * iconHeaderOptions.text.length;
        const h = 24;

        if (headerPosition == 'top') {
            textElem.setAttribute('x', '50%');
            textElem.setAttribute('y', String(h / 2));
            textElem.setAttribute('text-anchor', 'middle');
            textElem.setAttribute('dominant-baseline', 'central');
            rectElem.setAttribute('x', String((Number(svgWidth) - w) / 2));
            rectElem.setAttribute('y', String(0));
        } else if (headerPosition == 'bottom') {
            textElem.setAttribute('x', '50%');
            textElem.setAttribute('y', String(svgHeight - h / 2));
            textElem.setAttribute('text-anchor', 'middle');
            textElem.setAttribute('dominant-baseline', 'central');
            rectElem.setAttribute('x', String((Number(svgWidth) - w) / 2));
            rectElem.setAttribute('y', String((Number(svgHeight) - h)));
        } else if (headerPosition == 'center') {
            textElem.setAttribute('x', '50%');
            textElem.setAttribute('y', '50%');
            textElem.setAttribute('text-anchor', 'middle');
            textElem.setAttribute('dominant-baseline', 'central');
            rectElem.setAttribute('x', String((Number(svgWidth) - w) / 2));
            rectElem.setAttribute('y', String((Number(svgHeight) - h) / 2));
        }

        textElem.setAttribute('font-size', '24');
        textElem.setAttribute('fill', iconHeaderOptions.textColor);

        // Create a text node with the specified text and append it to the text element
        const textNode = svgDoc.createTextNode(iconHeaderOptions.text);
        textElem.appendChild(textNode);

        // Create a new g element to contain the background and text elements
        const gElem = svgDoc.createElement('g');

        // Create a rectangle element for the background
        rectElem.setAttribute('width', w); // Set the width to the width of the text element
        rectElem.setAttribute('height', h); // Set the height to the height of the text element
        rectElem.setAttribute('fill', iconHeaderOptions.color);

        // Append the rectangle element to the new g element
        gElem.appendChild(rectElem);

        // Append the text element to the new g element
        gElem.appendChild(textElem);

        // Append the text element to the SVG document
        svgDoc.documentElement.appendChild(gElem);
    }

    // Serialize the SVG document to a string
    const updatedSvgString = new XMLSerializer().serializeToString(svgDoc);

    return new Promise<void>((resolve, reject) => {
        fs.writeFile(outputFilePath, updatedSvgString, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

/// Draw version number banner on top or bottom of the icon.
function drawVersionheader(ctx: CanvasRenderingContext2D, x: number, y: number, headerPosition: string, iconHeaderOptions: IconOptions) {
    ctx.save();

    let height = 0.15 * y;
    let width = 0.5 * x;

    ctx.fillStyle = iconHeaderOptions.color;

    if (headerPosition == 'top') {
        ctx.fillRect(0.25 * x, 0, width, height);
    } else if (headerPosition == 'bottom') {
        ctx.fillRect(0.25 * x, y - height, width, height);
    } else if (headerPosition == 'center') {
        ctx.fillRect(0.25 * x, ((y + height) / 2) - height, width, height);
    }


    ctx.fillStyle = iconHeaderOptions.textColor;

    computeFontSize(ctx, iconHeaderOptions.text, width, height);

    let measure = ctx.measureText(iconHeaderOptions.text) as TextMetrics & { emHeightAscent: number, emHeightDescent: number };
    let textCenterX = (x / 2) - (measure.width / 2);
    var textCenterY = 0;

    if (headerPosition == 'top') {
        textCenterY = height - (((height) - measure.emHeightAscent - measure.emHeightDescent) / 2);
    } else if (headerPosition == 'bottom') {
        textCenterY = y - (((height) - measure.emHeightAscent - measure.emHeightDescent) / 2);
    } else if (headerPosition == 'center') {
        textCenterY = ((y + height) / 2) - (((height) - measure.emHeightAscent - measure.emHeightDescent) / 2);
    }

    ctx.translate(textCenterX, textCenterY);
    ctx.fillText(iconHeaderOptions.text, 0, 0);

    ctx.restore();
}

/// Draw version name banner on top or bottom right corner of the icon.
function drawHeadbannerRight(ctx: CanvasRenderingContext2D, x: number, y: number, headbannerColor: string, onTop: boolean) {
    ctx.beginPath();
    ctx.moveTo(0.3 * x, onTop ? 0 : y);
    ctx.lineTo(x, onTop ? 0.7 * y : 0.3 * y);
    ctx.lineTo(x, 0.5 * y);
    ctx.lineTo(x * 0.5, onTop ? 0 : y);
    ctx.closePath();
    ctx.fillStyle = headbannerColor;
    ctx.fill();
}

/// Draw version name banner on top or bottom left corner of the icon.
function drawHeadbannerLeft(ctx: CanvasRenderingContext2D, x: number, y: number, headbannerColor: string, onTop: boolean) {
    ctx.beginPath();
    ctx.moveTo(0.7 * x, onTop ? 0 : y);
    ctx.lineTo(0, onTop ? 0.7 * y : 0.3 * y);
    ctx.lineTo(0, 0.5 * y);
    ctx.lineTo(x * 0.5, onTop ? 0 : y);
    ctx.closePath();
    ctx.fillStyle = headbannerColor;
    ctx.fill();
}

/// Draw version name text on the right corner of the icon.
function drawText(ctx: CanvasRenderingContext2D, x: number, y: number, headbannerText: string, headbannerTextColor: string, headbannerPosition: BannerVersionNamePosition) {
    // Save current matrix state.
    ctx.save();

    // compute trapezoids bases
    let b = Math.sqrt(Math.pow(0.5 * x, 2) + Math.pow(0.5 * y, 2));
    let B = Math.sqrt(Math.pow((0.7) * x, 2) + Math.pow((0.7) * y, 2));

    // compute triangles areas
    let aTrg = 0.7 * x * 0.7 * y / 2;
    let aTrp = 0.5 * x * 0.5 * y / 2;

    // compute headbanner height
    let headbannerHeight = 2 * (aTrg - aTrp) / (B + b);

    ctx.fillStyle = headbannerTextColor;

    computeFontSize(ctx, headbannerText, b, headbannerHeight);

    let textHeight = ctx.measureText(headbannerText.toUpperCase()) as TextMetrics & { emHeightAscent: number, emHeightDescent: number };

    let ratio = 0.3255;

    // Calculate diagonal coordinates
    let teta = Math.acos(headbannerHeight / (0.2 * y)) * 180 / Math.PI;
    let a = Math.sin(teta) * 0.2 * y;
    let x1 = 1 - (((a * headbannerHeight) / (0.2 * y)) / x);

    var centerX = 0;

    if (headbannerPosition == BannerVersionNamePosition.TopRight || headbannerPosition == BannerVersionNamePosition.BottomRight) {
        centerX = ((0.5 + x1) * x) / 2;
    }
    else if (headbannerPosition == BannerVersionNamePosition.BottomLeft || headbannerPosition == BannerVersionNamePosition.TopLeft) {
        centerX = ((0.5 + (1 - x1)) * x) / 2;
    }

    centerX = centerX - (textHeight.width * ratio);

    var y1 = Math.sqrt(Math.pow(headbannerHeight, 2) - Math.pow(((1 - x1) * x), 2)) / y;
    var centerY = 0;

    // compute position and rotation angle
    var angle = Math.atan((0.5 * y) / (0.5 * x)) * 180 / Math.PI;

    if (headbannerPosition == BannerVersionNamePosition.BottomRight || headbannerPosition == BannerVersionNamePosition.BottomLeft) {
        centerY = ((1 + (0.5 - y1)) * y) / 2;
    } else if (headbannerPosition == BannerVersionNamePosition.TopRight || headbannerPosition == BannerVersionNamePosition.TopLeft) {
        centerY = ((0.5 + y1) * y) / 2;
    }

    var letterHeight = (textHeight.emHeightAscent - textHeight.emHeightDescent) / 2;

    switch (headbannerPosition) {
        case BannerVersionNamePosition.BottomRight:
            centerY = centerY + (textHeight.width * ratio);
            ctx.translate(centerX + (letterHeight * ratio), centerY + (letterHeight * ratio));
            ctx.rotate(- angle * Math.PI / 180);
            ctx.fillText(headbannerText.toUpperCase(), 0, 0);
            break;
        case BannerVersionNamePosition.TopLeft:
            centerY = centerY + (textHeight.width * ratio);
            ctx.translate(centerX, centerY + letterHeight);
            ctx.rotate(- angle * Math.PI / 180);
            ctx.fillText(headbannerText.toUpperCase(), 0, 0);
            break;
        case BannerVersionNamePosition.BottomLeft:
            centerY = centerY - (textHeight.width * ratio);
            ctx.translate(centerX - letterHeight, centerY);
            ctx.rotate(angle * Math.PI / 180);
            ctx.fillText(headbannerText.toUpperCase(), 0, 0);
            break;
        case BannerVersionNamePosition.TopRight:
            centerY = centerY - (textHeight.width * ratio);
            ctx.translate(centerX - (letterHeight * ratio), centerY + (letterHeight * ratio));
            ctx.rotate(angle * Math.PI / 180);
            ctx.fillText(headbannerText.toUpperCase(), 0, 0);
            break;
    }

    // Reset rotation and translation
    ctx.restore();
}

/// Compute the size of the font to be able to draw inside the banners.
function computeFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number) {
    var fontSize = maxHeight * 0.8;
    ctx.font = fontSize + "pt 'Roboto Bold'";
    var reduce = 0;

    while (ctx.measureText(text.toUpperCase()).width > maxWidth) {
        reduce = reduce + 0.001;
        fontSize = maxHeight * (0.8 - reduce);
        ctx.font = fontSize + "pt 'Roboto Bold'";
    }
}

run();
