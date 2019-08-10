export function rgb2hsl(r, g, b) {
    var max, min, h, s, l, d
    r /= 255
    g /= 255
    b /= 255
    max = Math.max(r, g, b)
    min = Math.min(r, g, b)
    l = (max + min) / 2
    if (max == min) {
        h = s = 0
    } else {
        d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0)
                break
            case g:
                h = (b - r) / d + 2
                break
            case b:
                h = (r - g) / d + 4
                break
        }
        h /= 6
    }

    return { h, s, l };
}

function add(a, b) {
    return {
        h: a.h + b.h,
        s: a.s + b.s,
        l: a.l + b.l,
    }
}

function diff(a, b) {
    return {
        h: a.h - b.h,
        s: a.s - b.s,
        l: a.l - b.l,
    }
}

function scale(a, b) {
    return {
        h: a.h * b,
        s: a.s * b,
        l: a.l * b,
    }
}

function interpolate(from, to) {
    const dc = diff(to, from);

    if (dc.h > 0.5) {
        dc.h = dc.h - 1;
    }

    return at => add(from, scale(dc, at));
}

export function to_css(color) {
    const h = Math.round(color.h * 360), s = Math.round(color.s * 100), l = Math.round(color.l * 100);

    return alpha => `hsla(${h}, ${s}%, ${l}%, ${alpha})`
}

export function linear(from, to, duration, callback) {
    let timeout;
    const durationMs = duration * 1000;
    const interp = interpolate(from, to);
    const startTime = Date.now();

    const each = () => {
        const elapsed = Date.now() - startTime;

        callback(interp(elapsed / durationMs));

        if (elapsed < durationMs) {
            timeout = setTimeout(each);
        }
    };

    timeout = setTimeout(each);

    return () => {
        clearTimeout(timeout);
    };
}