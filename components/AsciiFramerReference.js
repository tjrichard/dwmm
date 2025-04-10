function _define_property(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addPropertyControls, ControlType, RenderTarget, Color } from "framer";
import { useEffect, useState, useRef, useMemo } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { useColors } from "https://framerusercontent.com/modules/k76epLFsVsF4jlsF5pgg/ge79eoA2CuYo94sUAjT9/useColors.js";
const characterSets = {
  detailed:
    "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'.",
  standard: "@%#*+=-:.",
  blocks: "█▓▒░ ",
  binary: "01",
  hex: "0123456789ABCDEF",
};
const DEFAULT_IMAGE = {
  src: "https://framerusercontent.com/images/rMjuVOUhT39Hdz1kbwue16ZOySE.png",
  srcSet:
    "https://framerusercontent.com/images/rMjuVOUhT39Hdz1kbwue16ZOySE.png?scale-down-to=512 512w,https://framerusercontent.com/images/rMjuVOUhT39Hdz1kbwue16ZOySE.png 710w",
};
const DEFAULT_FONT = {
  fontFamily: '"Fragment Mono", monospace',
  fontSize: "12px",
  fontStyle: "normal",
  fontWeight: 400,
  letterSpacing: "0em",
  lineHeight: "1em",
};
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 *
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */ export default function InteractiveASCII(props) {
  const {
    cursor,
    backgroundColor,
    color,
    font,
    sizing,
    style,
    glow,
    staticEffect,
  } = props;
  const isCanvas = RenderTarget.current() === RenderTarget.canvas;
  const image = props.image || DEFAULT_IMAGE;
  const sizeMode =
    style?.width && style?.height
      ? "both"
      : style?.width
      ? "width"
      : style?.height
      ? "height"
      : "none";
  const isSolidColor = color.mode === "color";
  const ditheringMode = staticEffect ? "noise" : props.ditheringMode;
  const [text, setText] = useState("");
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const maskCtxRef = useRef(null);
  const ref = useRef(null);
  const textRef = useRef(null);
  const glowRef = useRef(null);
  const staticIntervalRef = useRef(null);
  const {
    x: cursorX,
    y: cursorY,
    initialized: cursorInitialized,
    initializedRef: cursorInitializedRef,
  } = useFollowCursor(cursor?.smoothing || 0, textRef);
  const lastValuesRef = useRef({
    cursorX: 0,
    cursorY: 0,
    cursorInitialized,
    outputWidth: props.outputWidth,
    characterSet: props.characterSet,
    customCharacterSet: props.customCharacterSet,
    ditheringMode,
    invertColors: props.invertColors,
    whiteMode: props.whiteMode,
    blur: props.blur,
    brightness: props.brightness,
    contrast: props.contrast,
    cursorStyle: cursor?.style,
    cursorInvert: cursor?.invert,
    cursorWidth: cursor?.width,
    font,
  });
  const [color1Value, color2Value] = useColors(
    isSolidColor ? "#FFF" : color.color1,
    isSolidColor ? "#FFF" : color.color2
  );
  const [color1Color, color2Color] = useMemo(
    () => [new Color(color1Value), new Color(color2Value)],
    [color1Value, color2Value]
  );
  const colorInterpolatorRef = useRef(() =>
    createColorInterpolator(color.mode, color1Color, color2Color)
  );
  const rngSeedRef = useRef(Math.random());
  const [img, setImg] = useState(null);
  const [cursorImg, setCursorImg] = useState(null);
  useEffect(() => {
    if (image?.src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImg(img);
      };
      img.src = image.src;
      return () => {
        img.onload = null;
      };
    } else {
      setImg(null);
    }
  }, [image]);
  useEffect(() => {
    if (cursor?.style === "image" && cursor?.image?.src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setCursorImg(img);
      };
      img.src = cursor.image.src;
      return () => {
        img.onload = null;
      };
    } else {
      setCursorImg(null);
    }
  }, [cursor?.style, cursor?.image]);
  useEffect(() => {
    colorInterpolatorRef.current = createColorInterpolator(
      color.mode,
      color1Color,
      color2Color
    );
  }, [color1Color, color2Color, color.mode]);
  useEffect(() => {
    lastValuesRef.current = {
      ...lastValuesRef.current,
      outputWidth: props.outputWidth,
      characterSet: props.characterSet,
      customCharacterSet: props.customCharacterSet,
      ditheringMode,
      invertColors: props.invertColors,
      whiteMode: props.whiteMode,
      blur: props.blur,
      brightness: props.brightness,
      contrast: props.contrast,
      font,
      cursorStyle: cursor?.style,
      cursorInvert: cursor?.invert,
      cursorWidth: cursor?.width,
    };
  }, [
    props.outputWidth,
    props.characterSet,
    props.customCharacterSet,
    ditheringMode,
    props.invertColors,
    props.whiteMode,
    props.blur,
    props.brightness,
    props.contrast,
    font,
    cursor?.style,
    cursor?.invert,
    cursor?.width,
  ]);
  useEffect(() => {
    // Initialize canvas and context
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      ctxRef.current = canvasRef.current.getContext("2d", {
        willReadFrequently: true,
      });
    }
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement("canvas");
      maskCtxRef.current = maskCanvasRef.current.getContext("2d", {
        willReadFrequently: true,
      });
    }
    if (img && ctxRef.current && maskCtxRef.current) {
      const loadImage = async () => {
        try {
          const { ascii, grayValues } = generateASCII(
            img,
            lastValuesRef.current,
            canvasRef.current,
            ctxRef.current,
            cursorX,
            cursorY,
            cursorInitializedRef,
            textRef,
            cursorImg,
            rngSeedRef
          );
          setText(ascii); // Update the mask with gradient colors
          if (!isSolidColor) {
            const { outputWidth: asciiWidth } = lastValuesRef.current;
            const asciiHeight = Math.round(
              (img.height / img.width) *
                asciiWidth *
                measureFontAspectRatio(font)
            );
            maskCanvasRef.current.width = asciiWidth;
            maskCanvasRef.current.height = asciiHeight;
            const imageData = maskCtxRef.current.getImageData(
              0,
              0,
              asciiWidth,
              asciiHeight
            );
            const data = imageData.data;
            for (let i = 0; i < grayValues.length; i++) {
              const gray = grayValues[i];
              const point1 =
                color.mode === "gradient"
                  ? color.color1Point / 100
                  : color.threshold / 100;
              const point2 =
                color.mode === "gradient" ? color.color2Point / 100 : 1;
              let percent;
              if (point1 === point2) {
                // If points are equal, pick color based on which side of the point the gray value falls
                percent = gray / 255 < point1 ? 0 : 1;
              } else {
                percent = Math.min(
                  Math.max(
                    mapRange(
                      gray / 255,
                      Math.min(point1, point2),
                      Math.max(point1, point2),
                      0,
                      1
                    ),
                    0
                  ),
                  1
                );
              }
              let interpolatedColor =
                percent <= point1
                  ? color1Color
                  : percent >= point2
                  ? color2Color
                  : colorInterpolatorRef.current(percent);
              const { r, g, b, a } = Color.toRgb(interpolatedColor);
              const idx = i * 4;
              data[idx] = isNaN(r) ? 0 : r;
              data[idx + 1] = isNaN(g) ? 0 : g;
              data[idx + 2] = isNaN(b) ? 0 : b;
              data[idx + 3] =
                typeof a === "number" ? (isNaN(a) ? 0 : a * 255) : 255;
            }
            maskCtxRef.current.putImageData(imageData, 0, 0);
          }
        } catch (error) {
          console.error("Error generating ASCII:", error);
        }
      };
      let needsUpdate = false; // Subscribe to motion value changes
      const unsubscribeX = cursorX.on("change", () => {
        needsUpdate = true;
      });
      const unsubscribeY = cursorY.on("change", () => {
        needsUpdate = true;
      }); // Set up interval to check for changes
      const intervalId = setInterval(() => {
        if (needsUpdate) {
          const currentValues = {
            ...lastValuesRef.current,
            cursorInitialized: cursorInitializedRef.current,
            cursorX: cursorX.get(),
            cursorY: cursorY.get(),
          }; // Check if any values have changed
          const hasChanged = Object.entries(currentValues).some(
            ([key, value]) => lastValuesRef.current[key] !== value
          );
          if (hasChanged) {
            loadImage();
            lastValuesRef.current = currentValues;
          }
          needsUpdate = false;
        }
      }, 24); // Set up static effect interval if enabled
      if (
        staticEffect &&
        staticEffect.interval > 0 &&
        !(isCanvas && staticEffect.preview === false)
      ) {
        // Clear any existing interval
        if (staticIntervalRef.current) {
          clearInterval(staticIntervalRef.current);
        } // Create new interval for static effect
        staticIntervalRef.current = setInterval(() => {
          rngSeedRef.current = Math.random();
          loadImage();
        }, staticEffect.interval * 1e3);
      } else if (staticIntervalRef.current) {
        // Clear interval if static effect is disabled
        clearInterval(staticIntervalRef.current);
        staticIntervalRef.current = null;
      } // Initial load
      loadImage();
      return () => {
        clearInterval(intervalId);
        if (staticIntervalRef.current) {
          clearInterval(staticIntervalRef.current);
          staticIntervalRef.current = null;
        }
        unsubscribeX();
        unsubscribeY();
      };
    }
    return () => {
      if (canvasRef.current) {
        canvasRef.current.remove();
      }
      if (maskCanvasRef.current) {
        maskCanvasRef.current.remove();
      }
      if (staticIntervalRef.current) {
        clearInterval(staticIntervalRef.current);
        staticIntervalRef.current = null;
      }
    };
  }, [img, props, cursorX, cursorY, cursorImg, staticEffect]);
  useEffect(() => {
    // Scale text to fit container width
    if (ref.current && textRef.current) {
      const updateScale = () => {
        const containerWidth = ref.current?.offsetWidth;
        const containerHeight = ref.current?.offsetHeight;
        const textWidth = textRef.current?.scrollWidth;
        const textHeight = textRef.current?.scrollHeight;
        if (textWidth && textHeight) {
          let scale = 1;
          let width = style?.width || "auto";
          let height = style?.height || "auto";
          switch (sizeMode) {
            case "width":
              scale = containerWidth / textWidth;
              height = style?.height || `${textHeight * scale}px`;
              break;
            case "height":
              scale = containerHeight / textHeight;
              width = style?.width || `${textWidth * scale}px`;
              break;
            case "both":
              const widthScale = containerWidth / textWidth;
              const heightScale = containerHeight / textHeight;
              scale =
                sizing === "fit"
                  ? Math.min(widthScale, heightScale)
                  : Math.max(widthScale, heightScale);
              break;
            case "none":
              scale = 1;
              break;
          }
          const translate = sizeMode === "none" ? "" : `translate(-50%, -50%)`;
          const transform = `${translate} scale(${scale})`;
          textRef.current.style.transform = transform;
          if (glowRef.current) {
            glowRef.current.style.transform = transform;
          }
          ref.current.style.width = width;
          ref.current.style.height = height;
        }
      };
      const resizeObserver = new ResizeObserver(updateScale);
      resizeObserver.observe(ref.current);
      resizeObserver.observe(textRef.current); // Initial scale
      updateScale();
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [text, sizeMode, sizing]);
  const textStyle = {
    width: "fit-content",
    height: "fit-content",
    color: color.mode === "color" ? color.color : "transparent",
    userSelect: "none",
    whiteSpace: "pre",
    textAlign: "center",
    transformOrigin: "center",
    fontVariantNumeric: "tabular-nums",
    ...(sizeMode !== "none"
      ? {
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }
      : {}),
    ...(!isSolidColor
      ? {
          backgroundImage: `url(${maskCanvasRef.current?.toDataURL()})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          imageRendering: "pixelated",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
        }
      : {}),
    ...font,
  };
  return /*#__PURE__*/ _jsxs("div", {
    ref: ref,
    style: {
      position: "relative",
      overflow: "hidden",
      backgroundColor,
      borderRadius: props.radius,
      ...style,
    },
    children: [
      glow?.blur > 0 &&
        glow?.opacity > 0 &&
        /*#__PURE__*/ _jsx("div", {
          ref: glowRef,
          style: {
            position: "absolute",
            filter: `blur(${glow.blur}px)`,
            ...textStyle,
            opacity: glow.opacity,
          },
          "aria-hidden": "true",
          children: text,
        }),
      /*#__PURE__*/ _jsx("div", {
        ref: textRef,
        style: { ...textStyle },
        "aria-label": image?.alt,
        children: text,
      }),
    ],
  });
}
InteractiveASCII.displayName = "Interactive ASCII";
addPropertyControls(InteractiveASCII, {
  cursor: {
    type: ControlType.Object,
    icon: "effect",
    optional: true,
    defaultValue: { size: 20, smoothing: 0 },
    controls: {
      style: {
        type: ControlType.Enum,
        defaultValue: "gradient",
        options: ["gradient", "circle", "image"],
        optionTitles: ["Gradient", "Circle", "Image"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
      },
      image: {
        type: ControlType.ResponsiveImage,
        hidden: (props) => props.style !== "image",
      },
      width: {
        type: ControlType.Number,
        defaultValue: 20,
        min: 1,
        max: 500,
        step: 1,
        description: "Measured in characters",
      },
      invert: { type: ControlType.Boolean, defaultValue: false },
      smoothing: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
      },
    },
  },
  image: {
    type: ControlType.ResponsiveImage,
    __defaultAssetReference:
      "data:framer/asset-reference,rMjuVOUhT39Hdz1kbwue16ZOySE.png?originalFilename=image.png&preferredSize=auto",
  },
  sizing: {
    type: ControlType.Enum,
    defaultValue: "fit",
    options: ["fit", "fill"],
    optionTitles: ["Fit", "Fill"],
    displaySegmentedControl: true,
  },
  font: {
    type: "font",
    defaultFontType: "monospace",
    displayTextAlignment: false,
    controls: "extended",
    defaultValue: { fontSize: 12, lineHeight: 1 },
  },
  color: {
    type: ControlType.Object,
    controls: {
      mode: {
        type: ControlType.Enum,
        options: ["color", "gradient", "glow"],
        optionTitles: ["Color", "Gradient", "Glow"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
      },
      color: {
        type: ControlType.Color,
        defaultValue: "#fff",
        hidden: (props) => props.mode !== "color",
      },
      color1: {
        type: ControlType.Color,
        defaultValue: "#fff",
        title: "Color 1",
        hidden: (props) => props.mode !== "gradient" && props.mode !== "glow",
      },
      color1Point: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        title: "Position",
        hidden: (props) => props.mode !== "gradient",
      },
      color2: {
        type: ControlType.Color,
        defaultValue: "#000",
        title: "Color 2",
        hidden: (props) => props.mode !== "gradient" && props.mode !== "glow",
      },
      color2Point: {
        type: ControlType.Number,
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        title: "Position",
        hidden: (props) => props.mode !== "gradient",
      },
      threshold: {
        type: ControlType.Number,
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props) => props.mode !== "glow",
      },
    },
  },
  glow: {
    type: ControlType.Object,
    optional: true,
    icon: "effect",
    controls: {
      blur: {
        type: ControlType.Number,
        defaultValue: 8,
        min: 1,
        max: 30,
        step: 1,
      },
      opacity: {
        type: ControlType.Number,
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
  },
  staticEffect: {
    type: ControlType.Object,
    optional: true,
    icon: "effect",
    title: "Static",
    controls: {
      preview: {
        type: ControlType.Boolean,
        defaultValue: true,
        description: "Show effect in editor",
      },
      interval: {
        type: ControlType.Number,
        defaultValue: 0.1,
        min: 0.05,
        max: 1,
        step: 0.01,
        unit: "s",
        description:
          "Makes the text change continuously like a static/noise effect",
      },
    },
  },
  backgroundColor: {
    type: ControlType.Color,
    defaultValue: "#000",
    optional: true,
    title: "Background",
  },
  outputWidth: {
    type: ControlType.Number,
    defaultValue: 100,
    min: 20,
    max: 500,
    step: 1,
    title: "Width",
  },
  characterSet: {
    type: ControlType.Enum,
    defaultValue: "detailed",
    options: ["detailed", "standard", "blocks", "binary", "hex", "custom"],
    optionTitles: [
      `Detailed (${characterSets.detailed})`,
      `Standard (${characterSets.standard})`,
      `Blocks (${characterSets.blocks})`,
      `Binary (${characterSets.binary})`,
      `Hex (${characterSets.hex})`,
      "Custom",
    ],
    title: "Characters",
  },
  customCharacterSet: {
    type: ControlType.String,
    defaultValue: "@%#*+=-:.",
    placeholder: "Character set",
    title: "Custom",
    hidden: (props) => props.characterSet !== "custom",
  },
  ditheringMode: {
    type: ControlType.Enum,
    defaultValue: "none",
    options: ["none", "floyd", "atkinson", "ordered"],
    optionTitles: ["None", "Floyd-Steinberg", "Atkinson", "Ordered"],
    title: "Dithering",
    hidden: (props) => !!props.staticEffect,
  },
  invertColors: {
    type: ControlType.Boolean,
    defaultValue: false,
    title: "Invert",
  },
  whiteMode: {
    type: ControlType.Enum,
    defaultValue: "ignore",
    options: ["keep", "ignore"],
    optionTitles: ["Keep", "Ignore"],
    displaySegmentedControl: true,
    title: "White",
  },
  blur: {
    type: ControlType.Number,
    defaultValue: 0,
    min: 0,
    max: 10,
    step: 1,
    displayStepper: true,
  },
  brightness: {
    type: ControlType.Number,
    defaultValue: 0,
    min: -100,
    max: 100,
  },
  contrast: { type: ControlType.Number, defaultValue: 0, min: -100, max: 100 },
  radius: {
    type: ControlType.BorderRadius,
    defaultValue: "0px",
    description:
      "More components at [Framer University](https://frameruni.link/cc).",
  },
}); // Helper Functions
// Measure font aspect ratio by creating a temporary element
function measureFontAspectRatio(font) {
  font = font || DEFAULT_FONT;
  const temp = document.createElement("div");
  temp.style.position = "absolute";
  temp.style.visibility = "hidden";
  temp.style.whiteSpace = "nowrap";
  temp.style.fontFamily = font.fontFamily;
  temp.style.fontWeight = font.fontWeight;
  temp.style.fontSize = font.fontSize;
  temp.style.lineHeight = font.lineHeight;
  temp.style.letterSpacing = font.letterSpacing;
  temp.textContent = "W";
  document.body.appendChild(temp);
  const width = temp.offsetWidth;
  const height = temp.offsetHeight;
  document.body.removeChild(temp);
  return width / height;
} // Clamp a value between min and max.
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
} // ASCII Art Generation Functions
// Generate grayscale 0-255 values from an image.
function generateGrayValues(
  img,
  props,
  canvas,
  ctx,
  cursorX,
  cursorY,
  cursorInitializedRef,
  containerRef,
  cursorImg
) {
  const {
    cursorStyle,
    cursorWidth,
    cursorInvert,
    outputWidth: asciiWidth,
    brightness,
    contrast: contrastValue,
    blur: blurValue,
    invertColors: invertEnabled,
    font,
  } = props;
  const contrastFactor =
    (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
  const fontAspectRatio = measureFontAspectRatio(font);
  const asciiHeight = Math.round(
    (img.height / img.width) * asciiWidth * fontAspectRatio
  );
  canvas.width = asciiWidth;
  canvas.height = asciiHeight;
  ctx.filter = blurValue > 0 ? `blur(${blurValue}px)` : "none";
  ctx.drawImage(img, 0, 0, asciiWidth, asciiHeight);
  if (cursorWidth && cursorInitializedRef.current) {
    // Map cursor coordinates from component space to ASCII grid space
    const mappedX = cursorX.get() * asciiWidth;
    const mappedY = cursorY.get() * (asciiHeight / fontAspectRatio);
    ctx.save();
    ctx.scale(1, fontAspectRatio);
    switch (cursorStyle) {
      case "gradient": {
        // Create a radial gradient for the cursor effect
        const gradient = ctx.createRadialGradient(
          mappedX,
          mappedY,
          0,
          mappedX,
          mappedY,
          cursorWidth / 2
        );
        if (cursorInvert) {
          gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        } else {
          gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, asciiWidth, asciiHeight / fontAspectRatio);
        break;
      }
      case "circle": {
        ctx.fillStyle = cursorInvert
          ? "rgba(255, 255, 255, 1)"
          : "rgba(0, 0, 0, 1)";
        ctx.beginPath();
        ctx.arc(mappedX, mappedY, cursorWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "image": {
        if (cursorImg) {
          // Calculate the size of the cursor image in ASCII grid space
          const cursorHeight =
            (cursorImg.height / cursorImg.width) * cursorWidth; // Draw the cursor image centered at the cursor position
          ctx.save();
          if (cursorInvert) {
            ctx.filter = "invert(1)";
          }
          ctx.drawImage(
            cursorImg,
            mappedX - cursorWidth / 2,
            mappedY - cursorHeight / 2,
            cursorWidth,
            cursorHeight
          );
          ctx.restore();
        }
        break;
      }
    }
    ctx.restore();
  }
  const imageData = ctx.getImageData(0, 0, asciiWidth, asciiHeight);
  const data = imageData.data;
  const gray = [];
  for (let i = 0; i < data.length; i += 4) {
    let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (invertEnabled) lum = 255 - lum;
    let adjusted = clamp(
      contrastFactor * (lum - 128) + 128 + brightness,
      0,
      255
    );
    gray.push(adjusted);
  }
  return { gray, asciiHeight };
} // Generate standard ASCII art (non-DOG modes).
function generateASCII(
  img,
  props,
  canvas,
  ctx,
  cursorX,
  cursorY,
  cursorInitializedRef,
  containerRef,
  cursorImg,
  rngSeedRef
) {
  const {
    outputWidth: asciiWidth,
    ditheringMode: ditherAlgorithm,
    characterSet: charset,
    customCharacterSet,
    whiteMode,
  } = props;
  const ignoreWhite = whiteMode === "ignore";
  const gradient =
    charset === "custom" ? customCharacterSet || "0 " : characterSets[charset];
  const nLevels = gradient.length;
  const { gray: grayOriginal, asciiHeight } = generateGrayValues(
    img,
    props,
    canvas,
    ctx,
    cursorX,
    cursorY,
    cursorInitializedRef,
    containerRef,
    cursorImg
  );
  const gray = [...grayOriginal];
  let ascii = "";
  if (ditherAlgorithm !== "none") {
    if (ditherAlgorithm === "floyd") {
      // Floyd–Steinberg dithering
      for (let y = 0; y < asciiHeight; y++) {
        let line = "";
        for (let x = 0; x < asciiWidth; x++) {
          const idx = y * asciiWidth + x;
          if (ignoreWhite && grayOriginal[idx] === 255) {
            line += " ";
            continue;
          }
          let computedLevel = Math.round((gray[idx] / 255) * (nLevels - 1));
          line += gradient.charAt(computedLevel);
          const newPixel = (computedLevel / (nLevels - 1)) * 255;
          const error = gray[idx] - newPixel;
          if (x + 1 < asciiWidth) {
            gray[idx + 1] = clamp(gray[idx + 1] + error * (7 / 16), 0, 255);
          }
          if (x - 1 >= 0 && y + 1 < asciiHeight) {
            gray[idx - 1 + asciiWidth] = clamp(
              gray[idx - 1 + asciiWidth] + error * (3 / 16),
              0,
              255
            );
          }
          if (y + 1 < asciiHeight) {
            gray[idx + asciiWidth] = clamp(
              gray[idx + asciiWidth] + error * (5 / 16),
              0,
              255
            );
          }
          if (x + 1 < asciiWidth && y + 1 < asciiHeight) {
            gray[idx + asciiWidth + 1] = clamp(
              gray[idx + asciiWidth + 1] + error * (1 / 16),
              0,
              255
            );
          }
        }
        ascii += line + "\n";
      }
    } else if (ditherAlgorithm === "atkinson") {
      // Atkinson dithering
      for (let y = 0; y < asciiHeight; y++) {
        let line = "";
        for (let x = 0; x < asciiWidth; x++) {
          const idx = y * asciiWidth + x;
          if (ignoreWhite && grayOriginal[idx] === 255) {
            line += " ";
            continue;
          }
          let computedLevel = Math.round((gray[idx] / 255) * (nLevels - 1));
          line += gradient.charAt(computedLevel);
          const newPixel = (computedLevel / (nLevels - 1)) * 255;
          const error = gray[idx] - newPixel;
          const diffusion = error / 8;
          if (x + 1 < asciiWidth) {
            gray[idx + 1] = clamp(gray[idx + 1] + diffusion, 0, 255);
          }
          if (x + 2 < asciiWidth) {
            gray[idx + 2] = clamp(gray[idx + 2] + diffusion, 0, 255);
          }
          if (y + 1 < asciiHeight) {
            if (x - 1 >= 0) {
              gray[idx - 1 + asciiWidth] = clamp(
                gray[idx - 1 + asciiWidth] + diffusion,
                0,
                255
              );
            }
            gray[idx + asciiWidth] = clamp(
              gray[idx + asciiWidth] + diffusion,
              0,
              255
            );
            if (x + 1 < asciiWidth) {
              gray[idx + asciiWidth + 1] = clamp(
                gray[idx + asciiWidth + 1] + diffusion,
                0,
                255
              );
            }
          }
          if (y + 2 < asciiHeight) {
            gray[idx + 2 * asciiWidth] = clamp(
              gray[idx + 2 * asciiWidth] + diffusion,
              0,
              255
            );
          }
        }
        ascii += line + "\n";
      }
    } else if (ditherAlgorithm === "noise") {
      const rng = new SeededRandom(rngSeedRef.current); // Noise dithering
      for (let y = 0; y < asciiHeight; y++) {
        let line = "";
        for (let x = 0; x < asciiWidth; x++) {
          const idx = y * asciiWidth + x;
          const randomValue = rng.next();
          if (ignoreWhite && grayOriginal[idx] === 255) {
            line += " ";
            continue;
          }
          const noise = (randomValue - 0.4) * (255 / nLevels);
          const noisyValue = clamp(gray[idx] + noise, 0, 255);
          let computedLevel = Math.round((noisyValue / 255) * (nLevels - 1));
          line += gradient.charAt(computedLevel);
        }
        ascii += line + "\n";
      }
    } else if (ditherAlgorithm === "ordered") {
      // Ordered dithering using a 4x4 Bayer matrix.
      const bayer = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ];
      const matrixSize = 4;
      for (let y = 0; y < asciiHeight; y++) {
        let line = "";
        for (let x = 0; x < asciiWidth; x++) {
          const idx = y * asciiWidth + x;
          if (ignoreWhite && grayOriginal[idx] === 255) {
            line += " ";
            continue;
          }
          const p = gray[idx] / 255;
          const t =
            (bayer[y % matrixSize][x % matrixSize] + 0.5) /
            (matrixSize * matrixSize);
          let valueWithDither = p + t - 0.5;
          valueWithDither = Math.min(Math.max(valueWithDither, 0), 1);
          let computedLevel = Math.floor(valueWithDither * nLevels);
          if (computedLevel >= nLevels) computedLevel = nLevels - 1;
          line += gradient.charAt(computedLevel);
        }
        ascii += line + "\n";
      }
    }
  } else {
    // Simple mapping without dithering.
    for (let y = 0; y < asciiHeight; y++) {
      let line = "";
      for (let x = 0; x < asciiWidth; x++) {
        const idx = y * asciiWidth + x;
        if (ignoreWhite && grayOriginal[idx] === 255) {
          line += " ";
          continue;
        }
        const computedLevel = Math.round((gray[idx] / 255) * (nLevels - 1));
        line += gradient.charAt(computedLevel);
      }
      ascii += line + "\n";
    }
  }
  return { ascii, grayValues: gray };
}
function useFollowCursor(smoothing = 0, containerRef) {
  const movementTransition = {
    damping: 100,
    stiffness: mapRange(smoothing, 0, 100, 2e3, 50),
  };
  const hasSpring = smoothing !== 0;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, movementTransition);
  const springY = useSpring(mouseY, movementTransition);
  const previousScrollXRef = useRef(0);
  const previousScrollYRef = useRef(0);
  const [initialized, setInitialized] = useState(false);
  const isInitializedRef = useRef(false);
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top; // Convert to percentages, handling edge cases to prevent infinite values
      const xPercent = rect.width === 0 ? 0 : x / rect.width;
      const yPercent = rect.height === 0 ? 0 : y / rect.height;
      mouseX.set(xPercent);
      mouseY.set(yPercent);
      if (!isInitializedRef.current) {
        springX.jump(xPercent);
        springY.jump(yPercent);
        isInitializedRef.current = true;
        setInitialized(true);
      }
    };
    const handleScroll = () => {
      if (!containerRef.current || !isInitializedRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollX =
        window.scrollX ||
        window.pageXOffset ||
        document.documentElement.scrollLeft;
      const scrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop; // Calculate scroll delta
      const deltaX = scrollX - previousScrollXRef.current;
      const deltaY = scrollY - previousScrollYRef.current; // Update previous scroll positions
      previousScrollXRef.current = scrollX;
      previousScrollYRef.current = scrollY; // Convert scroll delta to percentage, handling edge cases
      const deltaXPercent = rect.width === 0 ? 0 : deltaX / rect.width;
      const deltaYPercent = rect.height === 0 ? 0 : deltaY / rect.height; // Update position using scroll delta percentages
      mouseX.set(mouseX.get() + deltaXPercent);
      mouseY.set(mouseY.get() + deltaYPercent);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef]);
  return {
    initialized,
    initializedRef: isInitializedRef,
    x: hasSpring ? springX : mouseX,
    y: hasSpring ? springY : mouseY,
  };
}
function mapRange(value, fromLow, fromHigh, toLow, toHigh) {
  if (fromLow === fromHigh) {
    return toLow;
  }
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}
function createColorInterpolator(mode, color1, color2) {
  if (mode === "glow") {
    return Color.interpolate(
      color2,
      new Color(color2.r, color2.g, color2.b, 0)
    );
  }
  return Color.interpolate(color1, color2);
}
class SeededRandom {
  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  constructor(seed) {
    _define_property(this, "seed", void 0);
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
}
export const __FramerMetadata__ = {
  exports: {
    default: {
      type: "reactComponent",
      name: "InteractiveASCII",
      slots: [],
      annotations: {
        framerSupportedLayoutWidth: "any",
        framerSupportedLayoutHeight: "any",
        framerIntrinsicWidth: "400",
        framerIntrinsicHeight: "400",
        framerContractVersion: "1",
        framerDisableUnlink: "*",
      },
    },
    __FramerMetadata__: { type: "variable" },
  },
};
//# sourceMappingURL=./InteractiveASCII_Prod.map
