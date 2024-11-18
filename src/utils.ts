export class SuperGifUtils {

    static bitsToNum(ba) {
        return ba.reduce(function (s, n) {
            return s * 2 + n;
        }, 0);
    };

    static byteToBitArr(bite) {
        let a = [];
        for (let i = 7; i >= 0; i--) {
            a.push(!!(bite & (1 << i)));
        }
        return a;
    };

    static lzwDecode(minCodeSize, data) {
        // TODO: Now that the GIF parser is a bit different, maybe this should get an array of bytes instead of a String?
        let pos = 0; // Maybe this streaming thing should be merged with the Stream?
        let readCode = function (size) {
            let code = 0;
            for (let i = 0; i < size; i++) {
                if (pos >= data.length * 8) {
                    return null; // 返回 null 以指示读取超出范围
                }
                if (data.charCodeAt(pos >> 3) & (1 << (pos & 7))) {
                    code |= 1 << i;
                }
                pos++;
            }
            return code;
        };

        let output = [];

        let clearCode = 1 << minCodeSize;
        let eoiCode = clearCode + 1;

        let codeSize = minCodeSize + 1;

        let dict = [];

        let clear = function () {
            dict = [];
            codeSize = minCodeSize + 1;
            for (let i = 0; i < clearCode; i++) {
                dict[i] = [i];
            }
            dict[clearCode] = [];
            dict[eoiCode] = null;

        };

        let code;
        let last;

        while (true) {
            last = code;
            code = readCode(codeSize);
            // 检查 code 是否为 null
            if (code === null) {
                break; // 退出循环
            }
            if (code === clearCode) {
                clear();
                continue;
            }
            if (code === eoiCode) break;

            if (code < dict.length) {
                if (last !== clearCode) {
                    dict.push(dict[last].concat(dict[code][0]));
                }
            } else {
                if (code !== dict.length) throw new Error('Invalid LZW code.');
                dict.push(dict[last].concat(dict[last][0]));
            }
            output.push.apply(output, dict[code]);

            if (dict.length === (1 << codeSize) && codeSize < 12) {
                // If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
                codeSize++;
            }
        }

        // I don't know if this is technically an error, but some GIFs do it.
        //if (Math.ceil(pos / 8) !== data.length) throw new Error('Extraneous LZW bytes.');
        return output;
    };
}