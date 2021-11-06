"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const task = require("azure-pipelines-task-lib/task");
const fs = require("fs");
const PImage = require("pureimage");
const path = require("path");
class IconOptions {
    constructor(color, textColor, text) {
        this.color = color;
        this.textColor = textColor;
        this.text = text;
    }
}
var BannerVersionNamePosition;
(function (BannerVersionNamePosition) {
    BannerVersionNamePosition[BannerVersionNamePosition["BottomRight"] = 0] = "BottomRight";
    BannerVersionNamePosition[BannerVersionNamePosition["BottomLeft"] = 1] = "BottomLeft";
    BannerVersionNamePosition[BannerVersionNamePosition["TopLeft"] = 2] = "TopLeft";
    BannerVersionNamePosition[BannerVersionNamePosition["TopRight"] = 3] = "TopRight";
})(BannerVersionNamePosition || (BannerVersionNamePosition = {}));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let contents = task.getDelimitedInput('contents', '\n', true);
            let sourceFolder = task.getPathInput('sourceFolder', false, true);
            // This part of code is from the copy folder task. More info here: https://github.com/microsoft/azure-pipelines-tasks/tree/master/Tasks/CopyFilesV2
            // normalize the source folder path. this is important for later in order to accurately
            // determine the relative path of each found file (substring using sourceFolder.length).
            sourceFolder = path.normalize(sourceFolder);
            let allPaths = task.find(sourceFolder); // default find options (follow sym links)
            let sourceFolderPattern = sourceFolder.replace('[', '[[]'); // directories can have [] in them, and they have special meanings as a pattern, so escape them
            let matchedPaths = task.match(allPaths, contents, sourceFolderPattern); // default match options
            let matchedFiles = matchedPaths.filter((itemPath) => !task.stats(itemPath).isDirectory()); // filter-out directories
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
                let font = PImage.registerFont(path.join(__dirname, 'font/Roboto-Bold.ttf'), { family: 'Roboto Bold' });
                yield font.load(() => __awaiter(this, void 0, void 0, function* () {
                    for (let index = 0; index < matchedFiles.length; index++) {
                        yield generate(matchedFiles[index], bannerVersionNamePosition, bannerVersionNumberPosition, iconHeaderOptions, iconHeadbannerOptions);
                    }
                }));
            }
            task.setResult(task.TaskResult.Succeeded, "Banners generation succeeded");
        }
        catch (err) {
            console.log(err);
            task.setResult(task.TaskResult.Failed, err);
        }
    });
}
function generate(imagePath, headerBannerPosition, headerPosition, iconHeaderOptions, iconHeadbannerOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        PImage.decodePNGFromStream(fs.createReadStream(imagePath)).then((img) => {
            let ctx = img.getContext('2d');
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
            PImage.encodePNGToStream(img, fs.createWriteStream(imagePath)).then(() => {
                console.log("Edition succeeded for:" + imagePath);
            });
        });
    });
}
/// Draw version number banner on top or bottom of the icon.
function drawVersionheader(ctx, x, y, headerPosition, iconHeaderOptions) {
    ctx.save();
    let height = 0.15 * y;
    let width = 0.5 * x;
    ctx.fillStyle = iconHeaderOptions.color;
    if (headerPosition == 'top') {
        ctx.fillRect(0.25 * x, 0, width, height);
    }
    else if (headerPosition == 'bottom') {
        ctx.fillRect(0.25 * x, y - height, width, height);
    }
    else if (headerPosition == 'center') {
        ctx.fillRect(0.25 * x, ((y + height) / 2) - height, width, height);
    }
    ctx.fillStyle = iconHeaderOptions.textColor;
    computeFontSize(ctx, iconHeaderOptions.text, width, height);
    let measure = ctx.measureText(iconHeaderOptions.text);
    let textCenterX = (x / 2) - (measure.width / 2);
    var textCenterY = 0;
    if (headerPosition == 'top') {
        textCenterY = height - (((height) - measure.emHeightAscent - measure.emHeightDescent) / 2);
    }
    else if (headerPosition == 'bottom') {
        textCenterY = y - (((height) - measure.emHeightAscent - measure.emHeightDescent) / 2);
    }
    else if (headerPosition == 'center') {
        textCenterY = ((y + height) / 2) - (((height) - measure.emHeightAscent - measure.emHeightDescent) / 2);
    }
    ctx.translate(textCenterX, textCenterY);
    ctx.fillText(iconHeaderOptions.text, 0, 0);
    ctx.restore();
}
/// Draw version name banner on top or bottom right corner of the icon.
function drawHeadbannerRight(ctx, x, y, headbannerColor, onTop) {
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
function drawHeadbannerLeft(ctx, x, y, headbannerColor, onTop) {
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
function drawText(ctx, x, y, headbannerText, headbannerTextColor, headbannerPosition) {
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
    let textHeight = ctx.measureText(headbannerText.toUpperCase());
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
    }
    else if (headbannerPosition == BannerVersionNamePosition.TopRight || headbannerPosition == BannerVersionNamePosition.TopLeft) {
        centerY = ((0.5 + y1) * y) / 2;
    }
    var letterHeight = (textHeight.emHeightAscent - textHeight.emHeightDescent) / 2;
    switch (headbannerPosition) {
        case BannerVersionNamePosition.BottomRight:
            centerY = centerY + (textHeight.width * ratio);
            ctx.translate(centerX + (letterHeight * ratio), centerY + (letterHeight * ratio));
            ctx.rotate(-angle * Math.PI / 180);
            ctx.fillText(headbannerText.toUpperCase(), 0, 0);
            break;
        case BannerVersionNamePosition.TopLeft:
            centerY = centerY + (textHeight.width * ratio);
            ctx.translate(centerX, centerY + letterHeight);
            ctx.rotate(-angle * Math.PI / 180);
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
function computeFontSize(ctx, text, maxWidth, maxHeight) {
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
