(function (root) {
  "use strict";

  const WIDTH = 16;
  const HEIGHT = 16;
  const PIXEL_COUNT = WIDTH * HEIGHT;
  const HEADER = "p1";
  const COMPRESSED_HEADER = "r1";
  const RECT_HEADER = "k1";
  const CHECKSUM_LENGTH = 4;
  const CODE_LENGTH = HEADER.length + PIXEL_COUNT + CHECKSUM_LENGTH;
  const COMMAND_PREFIX = "!skin ";
  const LANG = typeof navigator !== "undefined" &&
    (navigator.languages || [navigator.language]).some(language =>
      String(language || "").toLowerCase().startsWith("ja"))
    ? "ja"
    : "en";
  const TEXT = {
    en: {
      title: "Pixel Avatar Editor",
      intro: "Draw a 16×16 avatar, then copy the code.",
      editorRegion: "Avatar editor",
      tools: "Drawing tools",
      pencil: "Pencil (B)",
      eraser: "Eraser (E)",
      picker: "Picker (I)",
      undo: "Undo",
      clear: "Clear",
      sample: "Sample",
      canvas: "16 by 16 pixel drawing canvas",
      palette: "Color palette",
      preview: "Preview",
      previewCanvas: "Avatar preview",
      ready: "Ready.",
      code: "Avatar code",
      copy: "Copy",
      loadExisting: "Load an existing code",
      paste: "Paste an existing code",
      load: "Load",
      cleared: "Canvas cleared.",
      sampleRestored: "Sample avatar restored.",
      sampleWarningTitle: "Replace the drawing?",
      sampleWarning: "Sample replaces the current avatar.",
      clearWarningTitle: "Clear the drawing?",
      clearWarning: "Clear removes the current avatar.",
      undone: "Undone.",
      cancel: "Cancel",
      sampleConfirm: "Replace",
      clearConfirm: "Clear",
      loaded: "Avatar code loaded.",
      copied: "Copied to clipboard.",
      copyFailed: "Copy failed. Select the text and copy it manually.",
      transparent: "Transparent",
      paletteColor: hex => `Palette ${hex}`,
      exactPixels: count => `An avatar requires exactly ${count} pixels.`,
      noPalette: index => `Pixel ${index} has no palette entry.`,
      pasteCode: "Paste an avatar code.",
      skinForm: "Commands must use the exact form '!skin <code>'.",
      whitespace: "The avatar code cannot contain whitespace.",
      version: (fixed, compressed, rects) => `Unsupported avatar version. Expected '${fixed}', '${compressed}', or '${rects}'.`,
      rectGroups: "Rectangle data must contain groups of 4 characters.",
      rectChars: "Rectangle data must be lowercase.",
      rectBounds: "A rectangle is outside the avatar.",
      expectedLength: (expected, received) => `Expected ${expected} characters, received ${received}.`,
      hexOnly: "Codes may contain lowercase hexadecimal characters only.",
      checksum: "Checksum mismatch. The avatar code is incomplete or corrupted.",
      pairs: "Compressed avatar payload must contain complete run/color pairs.",
      lowerPairs: "Compressed codes require lowercase run/color pairs.",
      checksumHex: "Checksum characters must be lowercase hexadecimal.",
      expandBeyond: count => `Compressed avatar expands beyond ${count} pixels.`,
      expandCount: (actual, expected) => `Compressed avatar expands to ${actual} pixels instead of ${expected}.`
    },
    ja: {
      title: "ピクセルアバターエディター",
      intro: "16×16のアバターを描いて、コードをコピーしてください。",
      editorRegion: "アバターエディター",
      tools: "描画ツール",
      pencil: "ペン (B)",
      eraser: "消しゴム (E)",
      picker: "スポイト (I)",
      undo: "元に戻す",
      clear: "クリア",
      sample: "サンプル",
      canvas: "16×16の描画キャンバス",
      palette: "カラーパレット",
      preview: "プレビュー",
      previewCanvas: "アバターのプレビュー",
      ready: "準備完了。",
      code: "アバターコード",
      copy: "コピー",
      loadExisting: "既存のコードを読み込む",
      paste: "既存のコードを貼り付け",
      load: "読み込む",
      cleared: "キャンバスを消去しました。",
      sampleRestored: "サンプルを復元しました。",
      sampleWarningTitle: "描画を置き換えますか？",
      sampleWarning: "サンプルで現在のアバターを置き換えます。",
      clearWarningTitle: "描画を消去しますか？",
      clearWarning: "現在のアバターを消去します。",
      undone: "元に戻しました。",
      cancel: "キャンセル",
      sampleConfirm: "置き換える",
      clearConfirm: "消去",
      loaded: "アバターコードを読み込みました。",
      copied: "コピーしました。",
      copyFailed: "コピーできませんでした。文字を選択して手動でコピーしてください。",
      transparent: "透明",
      paletteColor: hex => `パレット ${hex}`,
      exactPixels: count => `アバターは${count}ピクセルちょうど必要です。`,
      noPalette: index => `ピクセル${index}に対応する色がありません。`,
      pasteCode: "アバターコードを貼り付けてください。",
      skinForm: "コマンドは「!skin コード」の形式にしてください。",
      whitespace: "アバターコードに空白は使えません。",
      version: (fixed, compressed, rects) => `未対応の形式です。「${fixed}」、「${compressed}」、または「${rects}」にしてください。`,
      rectGroups: "矩形データは4文字ずつの組にしてください。",
      rectChars: "矩形データは小文字にしてください。",
      rectBounds: "矩形がアバターの範囲外です。",
      expectedLength: (expected, received) => `${expected}文字必要ですが、${received}文字でした。`,
      hexOnly: "コードは小文字の16進数だけ使えます。",
      checksum: "チェックサムが一致しません。コードが欠けているか壊れています。",
      pairs: "圧縮データの色の並びが途中で切れています。",
      lowerPairs: "圧縮コードは小文字の連長と色の組にしてください。",
      checksumHex: "チェックサムは小文字の16進数にしてください。",
      expandBeyond: count => `圧縮コードを展開すると${count}ピクセルを超えます。`,
      expandCount: (actual, expected) => `圧縮コードは${actual}ピクセルになります。${expected}ピクセル必要です。`
    }
  };

  function t(key, ...args) {
    const value = (TEXT[LANG] && TEXT[LANG][key]) || TEXT.en[key] || key;
    return typeof value === "function" ? value(...args) : value;
  }

  function applyLocale() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i18n]").forEach(element => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-label]").forEach(element => {
      element.setAttribute("aria-label", t(element.dataset.i18nLabel));
    });
  }
  const PALETTE = [
    [0x00, 0x00, 0x00, 0x00],
    [0x1a, 0x1c, 0x2c, 0xff],
    [0x5d, 0x27, 0x5d, 0xff],
    [0xb1, 0x3e, 0x53, 0xff],
    [0xef, 0x7d, 0x57, 0xff],
    [0xff, 0xcd, 0x75, 0xff],
    [0xa7, 0xf0, 0x70, 0xff],
    [0x38, 0xb7, 0x64, 0xff],
    [0x25, 0x71, 0x79, 0xff],
    [0x29, 0x36, 0x6f, 0xff],
    [0x3b, 0x5d, 0xc9, 0xff],
    [0x41, 0xa6, 0xf6, 0xff],
    [0x73, 0xef, 0xf7, 0xff],
    [0xf4, 0xf4, 0xf4, 0xff],
    [0x94, 0xb0, 0xc2, 0xff],
    [0x56, 0x6c, 0x86, 0xff]
  ];

  function checksum(body) {
    let hash = 0x811c9dc5;
    for (let index = 0; index < body.length; index += 1) {
      hash ^= body.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return (hash & 0xffff).toString(16).padStart(4, "0");
  }

  function encode(pixels) {
    validatePixels(pixels);
    let payload = "";
    for (let index = 0; index < pixels.length; index += 1) {
      const value = pixels[index];
      payload += value.toString(16);
    }
    const body = HEADER + payload;
    return body + checksum(body);
  }

  function encodeCompressed(pixels) {
    validatePixels(pixels);
    let payload = "";
    let index = 0;
    while (index < pixels.length) {
      const color = pixels[index];
      let runLength = 1;
      while (
        index + runLength < pixels.length &&
        pixels[index + runLength] === color &&
        runLength < 36
      ) {
        runLength += 1;
      }
      payload += (runLength - 1).toString(36) + color.toString(16);
      index += runLength;
    }
    const body = COMPRESSED_HEADER + payload;
    return body + checksum(body);
  }

  function encodeRects(pixels) {
    validatePixels(pixels);
    const covered = new Array(PIXEL_COUNT).fill(false);
    let payload = "";
    for (let start = 0; start < PIXEL_COUNT; start += 1) {
      if (covered[start] || pixels[start] === 0) continue;
      const color = pixels[start];
      const x0 = start % WIDTH;
      const y0 = Math.floor(start / WIDTH);
      let bestWidth = 1;
      let bestHeight = 1;
      let bestArea = 1;
      for (let width = 1; x0 + width <= WIDTH; width += 1) {
        const edge = y0 * WIDTH + x0 + width - 1;
        if (covered[edge] || pixels[edge] !== color) break;
        let height = 1;
        while (y0 + height < HEIGHT) {
          let rowFits = true;
          for (let dx = 0; dx < width; dx += 1) {
            const index = (y0 + height) * WIDTH + x0 + dx;
            if (covered[index] || pixels[index] !== color) {
              rowFits = false;
              break;
            }
          }
          if (!rowFits) break;
          height += 1;
        }
        const area = width * height;
        if (area > bestArea) {
          bestWidth = width;
          bestHeight = height;
          bestArea = area;
        }
      }
      for (let dy = 0; dy < bestHeight; dy += 1) {
        for (let dx = 0; dx < bestWidth; dx += 1) {
          covered[(y0 + dy) * WIDTH + x0 + dx] = true;
        }
      }
      const packed = x0 | (y0 << 4) | ((bestWidth - 1) << 8) | ((bestHeight - 1) << 12) | (color << 16);
      payload += packed.toString(36).padStart(4, "0");
    }
    const body = RECT_HEADER + payload;
    return body + checksum(body);
  }

  function encodeCompact(pixels) {
    return [encode(pixels), encodeCompressed(pixels), encodeRects(pixels)]
      .reduce((shortest, code) => code.length < shortest.length ? code : shortest);
  }

  function validatePixels(pixels) {
    if (!pixels || pixels.length !== PIXEL_COUNT) {
      throw new Error(t("exactPixels", PIXEL_COUNT));
    }
    for (let index = 0; index < pixels.length; index += 1) {
      const value = pixels[index];
      if (!Number.isInteger(value) || value < 0 || value >= PALETTE.length) {
        throw new Error(t("noPalette", index));
      }
    }
  }

  function decode(input) {
    let code = String(input == null ? "" : input).trim();
    if (!code) {
      throw new Error(t("pasteCode"));
    }
    if (code.startsWith(COMMAND_PREFIX)) {
      code = code.slice(COMMAND_PREFIX.length).trim();
    } else if (code.startsWith("!skin")) {
      throw new Error(t("skinForm"));
    }
    if (/\s/.test(code)) {
      throw new Error(t("whitespace"));
    }
    if (code.startsWith(RECT_HEADER)) return decodeRects(code);
    if (code.startsWith(HEADER)) return decodeFixed(code);
    if (code.startsWith(COMPRESSED_HEADER)) return decodeCompressed(code);
    throw new Error(t("version", HEADER, COMPRESSED_HEADER, RECT_HEADER));
  }

  function decodeRects(code) {
    const payloadLength = code.length - RECT_HEADER.length - CHECKSUM_LENGTH;
    if (payloadLength < 0 || payloadLength % 4 !== 0) {
      throw new Error(t("rectGroups"));
    }
    const body = code.slice(0, -CHECKSUM_LENGTH);
    const payload = body.slice(RECT_HEADER.length);
    if (!/^[0-9a-z]*$/.test(payload)) {
      throw new Error(t("rectChars"));
    }
    if (!/^[0-9a-f]{4}$/.test(code.slice(-CHECKSUM_LENGTH))) {
      throw new Error(t("checksumHex"));
    }
    if (code.slice(-CHECKSUM_LENGTH) !== checksum(body)) {
      throw new Error(t("checksum"));
    }

    const pixels = new Array(PIXEL_COUNT).fill(0);
    for (let index = 0; index < payload.length; index += 4) {
      const packed = parseInt(payload.slice(index, index + 4), 36);
      if (packed > 0xfffff) throw new Error(t("rectBounds"));
      const x = packed & 15;
      const y = (packed >> 4) & 15;
      const width = ((packed >> 8) & 15) + 1;
      const height = ((packed >> 12) & 15) + 1;
      const color = (packed >> 16) & 15;
      if (color >= PALETTE.length || x + width > WIDTH || y + height > HEIGHT) {
        throw new Error(t("rectBounds"));
      }
      for (let dy = 0; dy < height; dy += 1) {
        for (let dx = 0; dx < width; dx += 1) {
          pixels[(y + dy) * WIDTH + x + dx] = color;
        }
      }
    }
    return pixels;
  }

  function decodeFixed(code) {
    if (code.length !== CODE_LENGTH) {
      throw new Error(t("expectedLength", CODE_LENGTH, code.length));
    }
    if (!/^[0-9a-f]+$/.test(code.slice(HEADER.length))) {
      throw new Error(t("hexOnly"));
    }
    const body = code.slice(0, HEADER.length + PIXEL_COUNT);
    if (code.slice(-CHECKSUM_LENGTH) !== checksum(body)) {
      throw new Error(t("checksum"));
    }
    return Array.from(body.slice(HEADER.length), value => parseInt(value, 16));
  }

  function decodeCompressed(code) {
    const payloadLength = code.length - COMPRESSED_HEADER.length - CHECKSUM_LENGTH;
    if (payloadLength < 2 || payloadLength % 2 !== 0) {
      throw new Error(t("pairs"));
    }

    const body = code.slice(0, -CHECKSUM_LENGTH);
    const payload = body.slice(COMPRESSED_HEADER.length);
    if (!/^(?:[0-9a-z][0-9a-f])+$/.test(payload)) {
      throw new Error(t("lowerPairs"));
    }
    if (!/^[0-9a-f]{4}$/.test(code.slice(-CHECKSUM_LENGTH))) {
      throw new Error(t("checksumHex"));
    }
    if (code.slice(-CHECKSUM_LENGTH) !== checksum(body)) {
      throw new Error(t("checksum"));
    }

    const pixels = [];
    for (let index = 0; index < payload.length; index += 2) {
      const runLength = parseInt(payload[index], 36) + 1;
      const color = parseInt(payload[index + 1], 16);
      if (pixels.length + runLength > PIXEL_COUNT) {
        throw new Error(t("expandBeyond", PIXEL_COUNT));
      }
      for (let runPixel = 0; runPixel < runLength; runPixel += 1) {
        pixels.push(color);
      }
    }
    if (pixels.length !== PIXEL_COUNT) {
      throw new Error(t("expandCount", pixels.length, PIXEL_COUNT));
    }
    return pixels;
  }

  function createDefaultPixels() {
    const pixels = new Array(PIXEL_COUNT).fill(0);
    const set = (x, y, color) => { pixels[y * WIDTH + x] = color; };
    const fill = (x, y, width, height, color) => {
      for (let row = y; row < y + height; row += 1) {
        for (let column = x; column < x + width; column += 1) {
          set(column, row, color);
        }
      }
    };

    fill(5, 2, 6, 1, 1);
    fill(4, 3, 8, 6, 1);
    fill(5, 4, 6, 5, 5);
    fill(5, 3, 6, 2, 2);
    set(6, 6, 1);
    set(9, 6, 1);
    fill(6, 8, 4, 1, 4);
    fill(5, 9, 6, 1, 1);
    fill(4, 10, 8, 4, 1);
    fill(5, 10, 6, 3, 10);
    fill(3, 10, 1, 3, 5);
    fill(12, 10, 1, 3, 5);
    fill(5, 14, 2, 1, 1);
    fill(9, 14, 2, 1, 1);
    return pixels;
  }

  const format = {
    WIDTH,
    HEIGHT,
    PIXEL_COUNT,
    HEADER,
    COMPRESSED_HEADER,
    CODE_LENGTH,
    COMMAND_PREFIX,
    PALETTE,
    checksum,
    encode,
    encodeCompressed,
    encodeCompact,
    decode,
    createDefaultPixels
  };

  root.PixelAvatarFormat = format;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = format;
  }
  if (typeof document === "undefined") {
    return;
  }

  const editor = document.querySelector("#editor");
  const preview = document.querySelector("#preview");
  const editorContext = editor.getContext("2d");
  const previewContext = preview.getContext("2d");
  const rawCode = document.querySelector("#raw-code");
  const importCode = document.querySelector("#import-code");
  const status = document.querySelector("#status");
  const pencil = document.querySelector("#pencil");
  const eraser = document.querySelector("#eraser");
  const picker = document.querySelector("#picker");
  const paletteElement = document.querySelector("#palette");
  applyLocale();

  const undoButton = document.querySelector("#undo");
  const history = [];
  let pixels = createDefaultPixels();
  let selectedColor = 10;
  let tool = "pencil";
  let drawing = false;
  let altHeld = false;
  let strokeBefore = null;

  function samePixels(left, right) {
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return false;
    }
    return true;
  }

  function syncUndo() {
    undoButton.disabled = history.length === 0 && !strokeBefore;
  }

  function keep(before) {
    if (!before || samePixels(before, pixels)) return;
    history.push(before);
    if (history.length > 64) history.shift();
    syncUndo();
  }

  function undo() {
    drawing = false;
    const currentStroke = strokeBefore;
    strokeBefore = null;
    if (currentStroke && !samePixels(currentStroke, pixels)) {
      pixels = currentStroke;
      render();
      syncUndo();
      setStatus(t("undone"));
      return;
    }
    const before = history.pop();
    syncUndo();
    if (!before) return;
    pixels = before;
    render();
    setStatus(t("undone"));
  }

  function rgba(index) {
    const color = PALETTE[index];
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
  }

  function render() {
    const cell = editor.width / WIDTH;
    editorContext.clearRect(0, 0, editor.width, editor.height);
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const color = pixels[y * WIDTH + x];
        if (color !== 0) {
          editorContext.fillStyle = rgba(color);
          editorContext.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }

    editorContext.strokeStyle = "rgba(17, 19, 28, .22)";
    editorContext.lineWidth = 1;
    for (let index = 0; index <= WIDTH; index += 1) {
      const point = index * cell + 0.5;
      editorContext.beginPath();
      editorContext.moveTo(point, 0);
      editorContext.lineTo(point, editor.height);
      editorContext.stroke();
      editorContext.beginPath();
      editorContext.moveTo(0, point);
      editorContext.lineTo(editor.width, point);
      editorContext.stroke();
    }

    const image = editorContext.createImageData(WIDTH, HEIGHT);
    for (let index = 0; index < pixels.length; index += 1) {
      const color = PALETTE[pixels[index]];
      image.data.set(color, index * 4);
    }
    const buffer = document.createElement("canvas");
    buffer.width = WIDTH;
    buffer.height = HEIGHT;
    buffer.getContext("2d").putImageData(image, 0, 0);
    previewContext.imageSmoothingEnabled = false;
    previewContext.clearRect(0, 0, preview.width, preview.height);
    previewContext.drawImage(buffer, 0, 0, preview.width, preview.height);

    rawCode.value = encodeCompact(pixels);
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("error", Boolean(isError));
  }

  function useTool(next) {
    tool = next;
    pencil.classList.toggle("active", tool === "pencil");
    eraser.classList.toggle("active", tool === "eraser");
    picker.classList.toggle("active", tool === "picker");
    syncCursor();
  }

  function syncCursor() {
    editor.classList.toggle("picking", tool === "picker" || altHeld);
  }

  function cellAt(event) {
    const bounds = editor.getBoundingClientRect();
    const x = Math.floor((event.clientX - bounds.left) / bounds.width * WIDTH);
    const y = Math.floor((event.clientY - bounds.top) / bounds.height * HEIGHT);
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return null;
    return { x, y };
  }

  function selectColor(index) {
    selectedColor = index;
    paletteElement.querySelectorAll(".swatch").forEach((item, itemIndex) => {
      item.classList.toggle("selected", itemIndex === index);
    });
  }

  function pickAt(event) {
    const cell = cellAt(event);
    if (!cell) return;
    selectColor(pixels[cell.y * WIDTH + cell.x]);
  }

  function drawAt(event) {
    const cell = cellAt(event);
    if (!cell) return;
    pixels[cell.y * WIDTH + cell.x] = tool === "eraser" ? 0 : selectedColor;
    render();
  }

  PALETTE.forEach((color, index) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = `swatch${index === selectedColor ? " selected" : ""}${index === 0 ? " transparent" : ""}`;
    swatch.title = index === 0 ? t("transparent") : t("paletteColor", index.toString(16));
    swatch.setAttribute("aria-label", swatch.title);
    if (index !== 0) swatch.style.background = rgba(index);
    swatch.addEventListener("click", () => {
      selectColor(index);
      useTool(index === 0 ? "eraser" : "pencil");
    });
    paletteElement.appendChild(swatch);
  });

  function wantsPick(event) {
    return tool === "picker" || event.altKey || event.button === 2;
  }

  function finishStroke() {
    if (strokeBefore) keep(strokeBefore);
    strokeBefore = null;
    drawing = false;
    syncUndo();
  }

  editor.addEventListener("pointerdown", event => {
    drawing = wantsPick(event) ? "pick" : "draw";
    if (drawing === "pick") pickAt(event);
    else {
      strokeBefore = pixels.slice();
      syncUndo();
      drawAt(event);
    }
    try { editor.setPointerCapture(event.pointerId); } catch (error) { /* Pointer capture needs a real pointer. */ }
  });
  editor.addEventListener("pointermove", event => {
    if (drawing === "pick") pickAt(event);
    else if (drawing === "draw") drawAt(event);
  });
  editor.addEventListener("pointerup", finishStroke);
  editor.addEventListener("pointercancel", finishStroke);
  editor.addEventListener("contextmenu", event => event.preventDefault());

  pencil.addEventListener("click", () => useTool("pencil"));
  eraser.addEventListener("click", () => useTool("eraser"));
  picker.addEventListener("click", () => useTool("picker"));
  undoButton.addEventListener("click", undo);

  window.addEventListener("keydown", event => {
    if (!sampleDialog.hidden) {
      if (event.key === "Escape") closeSampleDialog();
      return;
    }
    const keyTarget = event.target;
    const typing = keyTarget && (keyTarget.tagName === "INPUT" || keyTarget.tagName === "TEXTAREA" || keyTarget.isContentEditable);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey && !typing) {
      event.preventDefault();
      undo();
      return;
    }
    if (event.key === "Alt") {
      altHeld = true;
      syncCursor();
      return;
    }
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
    const key = event.key.toLowerCase();
    if (key === "b") useTool("pencil");
    else if (key === "e") useTool("eraser");
    else if (key === "i") useTool("picker");
    else return;
    event.preventDefault();
  });
  window.addEventListener("keyup", event => {
    if (event.key !== "Alt") return;
    altHeld = false;
    syncCursor();
  });
  window.addEventListener("blur", () => {
    altHeld = false;
    syncCursor();
  });
  const sampleDialog = document.querySelector("#sample-dialog");
  const sampleDialogTitle = document.querySelector("#sample-dialog-title");
  const sampleDialogMessage = document.querySelector("#sample-dialog-message");
  const sampleCancel = document.querySelector("#sample-cancel");
  const sampleConfirm = document.querySelector("#sample-confirm");
  let sampleReturnFocus = null;
  let pendingConfirm = null;

  function canvasMatchesSample() {
    const sample = createDefaultPixels();
    return sample.every((color, index) => color === pixels[index]);
  }

  function canvasIsEmpty() {
    return pixels.every(color => color === 0);
  }

  function closeSampleDialog() {
    sampleDialog.hidden = true;
    pendingConfirm = null;
    if (sampleReturnFocus) sampleReturnFocus.focus();
  }

  function openConfirmDialog(title, message, confirm, action) {
    pendingConfirm = action;
    sampleDialogTitle.textContent = t(title);
    sampleDialogMessage.textContent = t(message);
    sampleConfirm.textContent = t(confirm);
    sampleReturnFocus = document.activeElement;
    sampleDialog.hidden = false;
    sampleCancel.focus();
  }

  document.querySelector("#clear").addEventListener("click", () => {
    if (canvasIsEmpty()) return;
    openConfirmDialog("clearWarningTitle", "clearWarning", "clearConfirm", () => {
      const before = pixels.slice();
      pixels.fill(0);
      keep(before);
      render();
      setStatus(t("cleared"));
    });
  });
  document.querySelector("#sample").addEventListener("click", () => {
    if (canvasMatchesSample()) return;
    openConfirmDialog("sampleWarningTitle", "sampleWarning", "sampleConfirm", () => {
      const before = pixels.slice();
      pixels = createDefaultPixels();
      keep(before);
      render();
      setStatus(t("sampleRestored"));
    });
  });
  sampleCancel.addEventListener("click", closeSampleDialog);
  sampleConfirm.addEventListener("click", () => {
    if (pendingConfirm) pendingConfirm();
    closeSampleDialog();
  });
  sampleDialog.addEventListener("click", event => {
    if (event.target === sampleDialog) closeSampleDialog();
  });
  document.querySelector("#load").addEventListener("click", () => {
    try {
      const before = pixels.slice();
      const next = decode(importCode.value);
      pixels = next;
      keep(before);
      render();
      setStatus(t("loaded"));
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.querySelectorAll("[data-copy]").forEach(button => {
    button.addEventListener("click", async () => {
      const field = document.querySelector(`#${button.dataset.copy}`);
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(field.value);
        } else {
          field.select();
          document.execCommand("copy");
        }
        setStatus(t("copied"));
      } catch {
        setStatus(t("copyFailed"), true);
      }
    });
  });

  render();
}(typeof globalThis !== "undefined" ? globalThis : this));
