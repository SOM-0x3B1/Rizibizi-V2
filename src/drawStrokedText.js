module.exports = {
    async drawStrokedText(ctx, text, x, y) {
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
    }
}