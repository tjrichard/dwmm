import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

// ASCII 문자 관련 상수
const ASCII_CONSTANTS = {
  DEFAULT_CHAR_WIDTH: 4,
  DEFAULT_CHAR_HEIGHT: 8,
  DEFAULT_CHAR_ASPECT_RATIO: 0.6,
  MIN_BRIGHTNESS: 0,
  MAX_BRIGHTNESS: 1
};

// 미리 정의된 캐릭터 세트 (기본값)
const DEFAULT_CHARACTER_SETS = {
  blocks: '█▓▒░ ',
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'.',
  standard: '@%#*+=-:.',
  binary: '01',
  hex: '0123456789ABCDEF'
};

// 유틸리티 함수들
const mapRange = (value, fromLow, fromHigh, toLow, toHigh) => {
  if (fromLow === fromHigh) {
    return toLow;
  }
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// 캔버스 크기 계산 함수
const calculateCanvasSize = (img, container, targetWidth, targetHeight) => {
  if (!container) return { width: 0, height: 0 };

  // 컨테이너의 실제 크기 가져오기
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight || 300; // 기본 높이 설정

  // 이미지의 원본 비율 계산
  const imageAspectRatio = img.width / img.height;

  let width, height;

  // targetWidth가 '100%'인 경우 컨테이너 너비 사용
  if (targetWidth === '100%') {
    // 최대 가능한 열 수 계산 (컨테이너 너비에 맞춤)
    const maxCols = Math.floor(containerWidth / ASCII_CONSTANTS.DEFAULT_CHAR_WIDTH);
    
    // 너비를 컨테이너 크기에 맞게 설정
    width = maxCols;
    
    // 너비에 맞춰서 비율대로 높이 계산
    height = Math.floor(width / imageAspectRatio);
    
    // 높이가 컨테이너를 벗어나는 경우 높이에 맞춰 조정
    const maxRows = Math.floor(containerHeight / ASCII_CONSTANTS.DEFAULT_CHAR_HEIGHT);
    if (height > maxRows) {
      height = maxRows;
      width = Math.floor(height * imageAspectRatio);
    }
  } 
  // targetHeight가 'auto'인 경우 너비에 맞춰 높이 계산
  else if (targetHeight === 'auto') {
    // 너비를 지정된 값 또는 컨테이너 크기로 설정
    const maxCols = Math.floor(containerWidth / ASCII_CONSTANTS.DEFAULT_CHAR_WIDTH);
    width = typeof targetWidth === 'number' ? 
      Math.min(targetWidth, maxCols) : 
      maxCols;
    
    // 비율대로 높이 계산
    height = Math.floor(width / imageAspectRatio);
    
    // 높이가 컨테이너를 벗어나는 경우 높이에 맞춰 조정
    const maxRows = Math.floor(containerHeight / ASCII_CONSTANTS.DEFAULT_CHAR_HEIGHT);
    if (height > maxRows) {
      height = maxRows;
      width = Math.floor(height * imageAspectRatio);
    }
  }
  // 둘 다 숫자인 경우 직접 지정된 크기 사용
  else {
    width = typeof targetWidth === 'number' ? targetWidth : containerWidth;
    height = typeof targetHeight === 'number' ? targetHeight : containerHeight;
    
    // 컨테이너 크기를 벗어나지 않도록 제한
    const maxCols = Math.floor(containerWidth / ASCII_CONSTANTS.DEFAULT_CHAR_WIDTH);
    const maxRows = Math.floor(containerHeight / ASCII_CONSTANTS.DEFAULT_CHAR_HEIGHT);
    
    if (width > maxCols) {
      width = maxCols;
      height = Math.floor(width / imageAspectRatio);
    }
    
    if (height > maxRows) {
      height = maxRows;
      width = Math.floor(height * imageAspectRatio);
    }
  }

  return { width, height };
};

// 폰트 종횡비 측정
const measureFontAspectRatio = (font) => {
  const temp = document.createElement('div');
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  temp.style.whiteSpace = 'nowrap';
  temp.style.fontFamily = font.fontFamily || 'monospace';
  temp.style.fontWeight = font.fontWeight || 'normal';
  temp.style.fontSize = font.fontSize || '10px';
  temp.style.lineHeight = font.lineHeight || '1';
  temp.style.letterSpacing = font.letterSpacing || 'normal';
  temp.textContent = 'W';
  document.body.appendChild(temp);
  const width = temp.offsetWidth;
  const height = temp.offsetHeight;
  document.body.removeChild(temp);
  return width / height;
};

// 커서 위치 추적 훅
const useFollowCursor = (smoothing = 0, containerRef) => {
  const movementTransition = {
    damping: 100,
    stiffness: mapRange(smoothing, 0, 100, 2000, 50)
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
    const handleMouseMove = event => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // 백분율로 변환
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
      const scrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      // 스크롤 변화량 계산
      const deltaX = scrollX - previousScrollXRef.current;
      const deltaY = scrollY - previousScrollYRef.current;
      
      // 이전 스크롤 위치 업데이트
      previousScrollXRef.current = scrollX;
      previousScrollYRef.current = scrollY;
      
      // 스크롤 변화량을 백분율로 변환
      const deltaXPercent = rect.width === 0 ? 0 : deltaX / rect.width;
      const deltaYPercent = rect.height === 0 ? 0 : deltaY / rect.height;
      
      // 스크롤 변화량으로 위치 업데이트
      mouseX.set(mouseX.get() + deltaXPercent);
      mouseY.set(mouseY.get() + deltaYPercent);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, mouseX, mouseY, springX, springY]);
  
  return {
    initialized,
    initializedRef: isInitializedRef,
    x: hasSpring ? springX : mouseX,
    y: hasSpring ? springY : mouseY
  };
};

// ASCII 변환 유틸리티 함수들
const AsciiUtils = {
  // 그레이스케일 변환
  toGrayscale: (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255,
  
  // 밝기값 보정
  adjustBrightness: (gray, brightness, contrast) => 
    Math.pow(gray * brightness, contrast),
  
  // 문자 인덱스 계산
  calculateCharIndex: (brightness, charSetLength) => 
    Math.floor(brightness * (charSetLength - 1)),
    
  // 글로우 효과가 적용된 밝기 계산
  getGlowAdjustedBrightness: (brightness, isGlowing, glowIntensity) => 
    isGlowing ? Math.min(1, brightness + glowIntensity * 0.5) : brightness
};

// ASCII 그레이스케일 값 생성 함수
const generateGrayValues = (img, props, canvas, ctx, cursorX, cursorY, cursorInitializedRef, containerRef, cursorImg) => {
  const {
    cursorStyle, 
    cursorWidth, 
    cursorInvert, 
    outputWidth: asciiWidth,
    brightness: brightVal, 
    contrast: contrastVal,
    blur: blurValue,
    invertColors: invertEnabled,
    font
  } = props;
  
  // 대비 계수 계산
  const contrastFactor = 259 * (contrastVal + 255) / (255 * (259 - contrastVal));
  const fontAspectRatio = measureFontAspectRatio(font);
  const asciiHeight = Math.round(img.height / img.width * asciiWidth * fontAspectRatio);
  
  // 캔버스 설정
  canvas.width = asciiWidth;
  canvas.height = asciiHeight;
  
  // 블러 필터 적용 (있는 경우)
  ctx.filter = blurValue > 0 ? `blur(${blurValue}px)` : 'none';
  ctx.drawImage(img, 0, 0, asciiWidth, asciiHeight);
  
  // 커서 효과 처리 (있는 경우)
  if (cursorWidth && cursorInitializedRef?.current) {
    // 커서 좌표를 ASCII 그리드 공간으로 매핑
    const mappedX = cursorX.get() * asciiWidth;
    const mappedY = cursorY.get() * (asciiHeight / fontAspectRatio);
    
    ctx.save();
    ctx.scale(1, fontAspectRatio);
    
    if (cursorStyle === 'gradient') {
      // 커서 효과를 위한 방사형 그라디언트 생성
      const gradient = ctx.createRadialGradient(mappedX, mappedY, 0, mappedX, mappedY, cursorWidth / 2);
      if (cursorInvert) {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, asciiWidth, asciiHeight / fontAspectRatio);
    } else if (cursorStyle === 'circle') {
      ctx.fillStyle = cursorInvert ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
      ctx.beginPath();
      ctx.arc(mappedX, mappedY, cursorWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (cursorStyle === 'image' && cursorImg) {
      // 커서 이미지의 크기 계산
      const cursorHeight = cursorImg.height / cursorImg.width * cursorWidth;
      
      // 커서 이미지를 커서 위치에 중앙 정렬하여 그리기
      ctx.save();
      if (cursorInvert) {
        ctx.filter = 'invert(1)';
      }
      ctx.drawImage(cursorImg, 
        mappedX - cursorWidth / 2, 
        mappedY - cursorHeight / 2, 
        cursorWidth, 
        cursorHeight
      );
      ctx.restore();
    }
    
    ctx.restore();
  }
  
  // 이미지 데이터 처리
  const imageData = ctx.getImageData(0, 0, asciiWidth, asciiHeight);
  const data = imageData.data;
  const gray = [];
  
  // 각 픽셀의 그레이스케일 값 계산
  for (let i = 0; i < data.length; i += 4) {
    let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (invertEnabled) lum = 255 - lum;
    
    // 대비와 밝기 조정
    let adjusted = clamp(contrastFactor * (lum - 128) + 128 + brightVal, 0, 255);
    gray.push(adjusted);
  }
  
  return { gray, asciiHeight };
};

// 난수 생성기 클래스
class SeededRandom {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  
  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

// 디더링 처리를 포함한 ASCII 아트 생성
const generateASCII = (img, props, canvas, ctx, cursorX, cursorY, cursorInitializedRef, containerRef, cursorImg, rngSeedRef) => {
  const {
    outputWidth: asciiWidth,
    ditheringMode: ditherAlgorithm,
    characterSet: charset,
    customCharacterSet,
    whiteMode,
    characterSets
  } = props;
  
  // 실제 사용할 문자 세트 사전 결정 (외부에서 전달받거나 기본값 사용)
  const effectiveCharacterSets = characterSets && typeof characterSets === 'object' ? characterSets : DEFAULT_CHARACTER_SETS;
  
  // 디버깅: 문자 세트 로깅
  console.log('[ASCII] Using characterSet:', charset);
  console.log('[ASCII] Available sets in characterSets:', effectiveCharacterSets ? Object.keys(effectiveCharacterSets) : 'None');
  console.log('[ASCII] Available sets in DEFAULT_CHARACTER_SETS:', Object.keys(DEFAULT_CHARACTER_SETS));
  
  const ignoreWhite = whiteMode === 'ignore';
  
  // 사용할 문자 세트 결정 (안전하게 액세스)
  let gradient;
  
  if (charset === 'custom') {
    gradient = customCharacterSet || '0 ';
    console.log('[ASCII] Using custom character set:', gradient);
  } else {
    // 외부에서 전달받은 문자 세트를 먼저 확인하고, 없을 경우 기본값 사용
    const hasExternalSet = effectiveCharacterSets && 
                         typeof effectiveCharacterSets === 'object' && 
                         charset in effectiveCharacterSets && 
                         effectiveCharacterSets[charset];
    
    const hasDefaultSet = DEFAULT_CHARACTER_SETS && 
                        charset in DEFAULT_CHARACTER_SETS && 
                        DEFAULT_CHARACTER_SETS[charset];
    
    if (hasExternalSet) {
      // 외부 전달 문자 세트 사용
      gradient = effectiveCharacterSets[charset];
      console.log(`[ASCII] Using external character set "${charset}":`, gradient);
    } else if (hasDefaultSet) {
      // 기본 문자 세트 사용
      gradient = DEFAULT_CHARACTER_SETS[charset];
      console.log(`[ASCII] Using built-in character set "${charset}":`, gradient);
    } else {
      // 문자 세트를 찾을 수 없는 경우
      console.warn(`[ASCII] Character set "${charset}" not found in any source, using default`);
      gradient = DEFAULT_CHARACTER_SETS.detailed; // 항상 기본값이 있음을 보장
    }
  }
  
  // 최소한 하나의 문자는 필요
  if (!gradient || gradient.length === 0) {
    console.error('[ASCII] Empty character set, using fallback');
    gradient = '.#'; // 최소 폴백 문자 세트
  }
  
  const nLevels = gradient.length;
  
  // 그레이스케일 값 생성
  const { gray: grayOriginal, asciiHeight } = generateGrayValues(
    img, props, canvas, ctx, cursorX, cursorY, cursorInitializedRef, containerRef, cursorImg
  );
  
  const gray = [...grayOriginal];
  let ascii = '';
  
  // 디더링 적용
  if (ditherAlgorithm === 'floyd') {
    // Floyd–Steinberg 디더링
    for (let y = 0; y < asciiHeight; y++) {
      let line = '';
      for (let x = 0; x < asciiWidth; x++) {
        const idx = y * asciiWidth + x;
        
        if (ignoreWhite && grayOriginal[idx] === 255) {
          line += ' ';
          continue;
        }
        
        let computedLevel = Math.round(gray[idx] / 255 * (nLevels - 1));
        line += gradient.charAt(computedLevel);
        
        const newPixel = computedLevel / (nLevels - 1) * 255;
        const error = gray[idx] - newPixel;
        
        // 오차 확산
        if (x + 1 < asciiWidth) {
          gray[idx + 1] = clamp(gray[idx + 1] + error * (7 / 16), 0, 255);
        }
        
        if (x - 1 >= 0 && y + 1 < asciiHeight) {
          gray[idx - 1 + asciiWidth] = clamp(gray[idx - 1 + asciiWidth] + error * (3 / 16), 0, 255);
        }
        
        if (y + 1 < asciiHeight) {
          gray[idx + asciiWidth] = clamp(gray[idx + asciiWidth] + error * (5 / 16), 0, 255);
        }
        
        if (x + 1 < asciiWidth && y + 1 < asciiHeight) {
          gray[idx + asciiWidth + 1] = clamp(gray[idx + asciiWidth + 1] + error * (1 / 16), 0, 255);
        }
      }
      ascii += line + '\n';
    }
  } else if (ditherAlgorithm === 'atkinson') {
    // Atkinson 디더링
    for (let y = 0; y < asciiHeight; y++) {
      let line = '';
      for (let x = 0; x < asciiWidth; x++) {
        const idx = y * asciiWidth + x;
        
        if (ignoreWhite && grayOriginal[idx] === 255) {
          line += ' ';
          continue;
        }
        
        let computedLevel = Math.round(gray[idx] / 255 * (nLevels - 1));
        line += gradient.charAt(computedLevel);
        
        const newPixel = computedLevel / (nLevels - 1) * 255;
        const error = gray[idx] - newPixel;
        
        // 오차 확산 (Atkinson)
        const diffusion = error / 8;
        
        if (x + 1 < asciiWidth) {
          gray[idx + 1] = clamp(gray[idx + 1] + diffusion, 0, 255);
        }
        
        if (x + 2 < asciiWidth) {
          gray[idx + 2] = clamp(gray[idx + 2] + diffusion, 0, 255);
        }
        
        if (y + 1 < asciiHeight) {
          if (x - 1 >= 0) {
            gray[idx - 1 + asciiWidth] = clamp(gray[idx - 1 + asciiWidth] + diffusion, 0, 255);
          }
          gray[idx + asciiWidth] = clamp(gray[idx + asciiWidth] + diffusion, 0, 255);
          if (x + 1 < asciiWidth) {
            gray[idx + asciiWidth + 1] = clamp(gray[idx + asciiWidth + 1] + diffusion, 0, 255);
          }
        }
        
        if (y + 2 < asciiHeight) {
          gray[idx + 2 * asciiWidth] = clamp(gray[idx + 2 * asciiWidth] + diffusion, 0, 255);
        }
      }
      ascii += line + '\n';
    }
  } else if (ditherAlgorithm === 'noise') {
    // Noise 디더링
    const rng = new SeededRandom(rngSeedRef.current);
    for (let y = 0; y < asciiHeight; y++) {
      let line = '';
      for (let x = 0; x < asciiWidth; x++) {
        const idx = y * asciiWidth + x;
        const randomValue = rng.next();
        
        if (ignoreWhite && grayOriginal[idx] === 255) {
          line += ' ';
          continue;
        }
        
        const noise = (randomValue - 0.4) * (255 / nLevels);
        const noisyValue = clamp(gray[idx] + noise, 0, 255);
        let computedLevel = Math.round(noisyValue / 255 * (nLevels - 1));
        line += gradient.charAt(computedLevel);
      }
      ascii += line + '\n';
    }
  } else if (ditherAlgorithm === 'ordered') {
    // 정렬된 디더링 (4x4 Bayer 매트릭스 사용)
    const bayer = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];
    const matrixSize = 4;
    
    for (let y = 0; y < asciiHeight; y++) {
      let line = '';
      for (let x = 0; x < asciiWidth; x++) {
        const idx = y * asciiWidth + x;
        
        if (ignoreWhite && grayOriginal[idx] === 255) {
          line += ' ';
          continue;
        }
        
        const p = gray[idx] / 255;
        const t = (bayer[y % matrixSize][x % matrixSize] + 0.5) / (matrixSize * matrixSize);
        let valueWithDither = p + t - 0.5;
        valueWithDither = Math.min(Math.max(valueWithDither, 0), 1);
        
        let computedLevel = Math.floor(valueWithDither * nLevels);
        if (computedLevel >= nLevels) computedLevel = nLevels - 1;
        
        line += gradient.charAt(computedLevel);
      }
      ascii += line + '\n';
    }
  } else {
    // 디더링 없이 단순 매핑
    for (let y = 0; y < asciiHeight; y++) {
      let line = '';
      for (let x = 0; x < asciiWidth; x++) {
        const idx = y * asciiWidth + x;
        
        if (ignoreWhite && grayOriginal[idx] === 255) {
          line += ' ';
          continue;
        }
        
        const computedLevel = Math.round(gray[idx] / 255 * (nLevels - 1));
        line += gradient.charAt(computedLevel);
      }
      ascii += line + '\n';
    }
  }
  
  return { ascii, grayValues: gray };
};

/**
 * AsciiImageGenerator 컴포넌트
 * 이미지를 ASCII 아트로 변환하고 다양한 효과와 스타일을 적용합니다.
 */
const AsciiImageGenerator = ({
  imageUrl,
  alt = '',
  characterSet = 'detailed',
  customCharacterSet = '',
  color1 = '#000000',
  color2 = '#FFFFFF',
  ditheringMode = 'none',
  whiteMode = 'ignore',
  invertColors = false,
  blur = 0,
  brightness = 0,
  contrast = 0,
  enableTransparency = false,
  transparencyThreshold = 0.9,
  invertTransparency = false,
  width = '100%',
  height = 'auto',
  extractColors = false,
  outputWidth = 100,
  cursor = null,
  staticEffect = null,
  characterSets = null,
  font = {
    fontFamily: 'monospace',
    fontSize: '10px',
    lineHeight: 1
  }
}) => {
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const asciiRef = useRef(null);
  const extractColorsRef = useRef(extractColors);
  const ctxRef = useRef(null);
  const maskCtxRef = useRef(null);
  const staticIntervalRef = useRef(null);
  const rngSeedRef = useRef(Math.random());
  
  const [ascii, setAscii] = useState('');
  const [grayValues, setGrayValues] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [extractedColors, setExtractedColors] = useState({ color1, color2 });
  const [colorCounts, setColorCounts] = useState({});
  const [img, setImg] = useState(null);
  const [cursorImg, setCursorImg] = useState(null);
  
  // 커서 효과를 위한 상태
  const { x: cursorX, y: cursorY, initialized: cursorInitialized, initializedRef: cursorInitializedRef } = 
    useFollowCursor(cursor?.smoothing || 0, asciiRef);
  
  // 마지막 처리된 값 추적
  const lastValuesRef = useRef({
    cursorX: 0,
    cursorY: 0,
    cursorInitialized,
    outputWidth,
    characterSet,
    customCharacterSet,
    characterSets,
    ditheringMode,
    invertColors,
    whiteMode,
    blur,
    brightness,
    contrast,
    cursorStyle: cursor?.style,
    cursorInvert: cursor?.invert,
    cursorWidth: cursor?.width,
    font
  });
  
  // extractColors prop이 변경되면 ref 업데이트
  useEffect(() => {
    extractColorsRef.current = extractColors;
  }, [extractColors]);
  
  // 이미지 로드
  useEffect(() => {
    if (imageUrl) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        setImg(image);
        setImageLoaded(true);
        setError(null);
      };
      image.onerror = () => {
        setError('이미지를 로드할 수 없습니다.');
        setImageLoaded(false);
      };
      image.src = imageUrl;
      
      return () => {
        image.onload = null;
        image.onerror = null;
      };
    } else {
      setImageLoaded(false);
      setError('이미지 URL이 제공되지 않았습니다.');
    }
  }, [imageUrl]);
  
  // 커서 이미지 로드 (필요한 경우)
  useEffect(() => {
    if (cursor?.style === 'image' && cursor?.image?.src) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        setCursorImg(image);
      };
      image.src = cursor.image.src;
      
      return () => {
        image.onload = null;
      };
    } else {
      setCursorImg(null);
    }
  }, [cursor?.style, cursor?.image]);
  
  // 캔버스 및 컨텍스트 초기화
  useEffect(() => {
    // 캔버스 초기화
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      ctxRef.current = canvasRef.current.getContext('2d', { willReadFrequently: true });
    }
    
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement('canvas');
      maskCtxRef.current = maskCanvasRef.current.getContext('2d', { willReadFrequently: true });
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
  }, []);
  
  // 처리할 속성 업데이트
  useEffect(() => {
    lastValuesRef.current = {
      ...lastValuesRef.current,
      outputWidth,
      characterSet,
      customCharacterSet,
      characterSets,
      ditheringMode,
      invertColors,
      whiteMode,
      blur,
      brightness,
      contrast,
      font,
      cursorStyle: cursor?.style,
      cursorInvert: cursor?.invert,
      cursorWidth: cursor?.width
    };
  }, [
    outputWidth, characterSet, customCharacterSet, characterSets, ditheringMode, 
    invertColors, whiteMode, blur, brightness, contrast, font,
    cursor?.style, cursor?.invert, cursor?.width
  ]);
  
  // 메인 이미지 처리 로직
  useEffect(() => {
    if (img && ctxRef.current && maskCtxRef.current) {
      const loadImage = async () => {
        try {
          const { ascii: asciiText, grayValues: grayVals } = generateASCII(
            img,
            lastValuesRef.current,
            canvasRef.current,
            ctxRef.current,
            cursorX,
            cursorY,
            cursorInitializedRef,
            asciiRef,
            cursorImg,
            rngSeedRef
          );
          
          setAscii(asciiText);
          setGrayValues(grayVals);
          
          // 그라디언트 색상으로 마스크 업데이트
          const { outputWidth: asciiWidth } = lastValuesRef.current;
          const fontAspectRatio = measureFontAspectRatio(font);
          const asciiHeight = Math.round(img.height / img.width * asciiWidth * fontAspectRatio);
          
          maskCanvasRef.current.width = asciiWidth;
          maskCanvasRef.current.height = asciiHeight;
          
          const imageData = maskCtxRef.current.getImageData(0, 0, asciiWidth, asciiHeight);
          const data = imageData.data;
          
          for (let i = 0; i < grayVals.length; i++) {
            const gray = grayVals[i];
            const percent = gray / 255;
            
            // 선형 보간으로 색상 계산
            const r1 = parseInt(color1.slice(1, 3), 16);
            const g1 = parseInt(color1.slice(3, 5), 16);
            const b1 = parseInt(color1.slice(5, 7), 16);
            
            const r2 = parseInt(color2.slice(1, 3), 16);
            const g2 = parseInt(color2.slice(3, 5), 16);
            const b2 = parseInt(color2.slice(5, 7), 16);
            
            const r = Math.round(r1 + (r2 - r1) * percent);
            const g = Math.round(g1 + (g2 - g1) * percent);
            const b = Math.round(b1 + (b2 - b1) * percent);
            
            const idx = i * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
          
          maskCtxRef.current.putImageData(imageData, 0, 0);
          
          // 컨테이너 크기 설정
          setContainerSize({ width: asciiWidth, height: asciiHeight });
          
          // 색상 추출 (옵션)
          if (extractColorsRef.current) {
            const imageData = ctxRef.current.getImageData(0, 0, asciiWidth, asciiHeight);
            const colors = extractMainColors(imageData, asciiWidth, asciiHeight);
            setExtractedColors(colors);
          }
        } catch (error) {
          console.error('Error generating ASCII:', error);
        }
      };
      
      let needsUpdate = false;
      
      // 모션 값 변경 구독
      const unsubscribeX = cursorX.on('change', () => {
        needsUpdate = true;
      });
      
      const unsubscribeY = cursorY.on('change', () => {
        needsUpdate = true;
      });
      
      // 변경 사항을 확인하기 위한 인터벌 설정
      const intervalId = setInterval(() => {
        if (needsUpdate) {
          const currentValues = {
            ...lastValuesRef.current,
            cursorInitialized: cursorInitializedRef.current,
            cursorX: cursorX.get(),
            cursorY: cursorY.get()
          };
          
          // 값이 변경되었는지 확인
          const hasChanged = Object.entries(currentValues).some(
            ([key, value]) => lastValuesRef.current[key] !== value
          );
          
          if (hasChanged) {
            loadImage();
            lastValuesRef.current = currentValues;
          }
          
          needsUpdate = false;
        }
      }, 24);
      
      // 정적 효과 인터벌 설정 (활성화된 경우)
      if (staticEffect && staticEffect.interval > 0) {
        // 기존 인터벌 정리
        if (staticIntervalRef.current) {
          clearInterval(staticIntervalRef.current);
        }
        
        // 정적 효과용 새 인터벌 생성
        staticIntervalRef.current = setInterval(() => {
          rngSeedRef.current = Math.random();
          loadImage();
        }, staticEffect.interval * 1000);
      } else if (staticIntervalRef.current) {
        // 정적 효과가 비활성화된 경우 인터벌 정리
        clearInterval(staticIntervalRef.current);
        staticIntervalRef.current = null;
      }
      
      // 초기 로드
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
  }, [img, cursorX, cursorY, cursorImg, staticEffect, color1, color2, font, characterSets, characterSet]);
  
  // 이미지에서 주요 색상을 추출하는 함수 (기존과 동일)
  const extractMainColors = (imgData, imgWidth, imgHeight) => {
    const pixels = imgData.data;
    let newColorCounts = {};
    let dominantColors = [];
    
    // 모든 픽셀을 스캔하고 색상 빈도 계산
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      // 투명 픽셀은 건너뜀
      if (a < 128) continue;
      
      // 유사한 색상을 그룹화하기 위해 색상값을 양자화
      const quantizedR = Math.round(r / 10) * 10;
      const quantizedG = Math.round(g / 10) * 10;
      const quantizedB = Math.round(b / 10) * 10;
      
      const key = `${quantizedR},${quantizedG},${quantizedB}`;
      if (!newColorCounts[key]) {
        newColorCounts[key] = {
          count: 0,
          r: quantizedR,
          g: quantizedG,
          b: quantizedB,
          originalPixels: []
        };
      }
      
      // 원본 색상 샘플 저장 (최대 10개)
      if (newColorCounts[key].originalPixels.length < 10) {
        newColorCounts[key].originalPixels.push({ r, g, b });
      }
      
      newColorCounts[key].count++;
    }
    
    // colorCounts 상태 업데이트
    setColorCounts(newColorCounts);
    
    // 색상 빈도순으로 정렬
    const sortedColors = Object.values(newColorCounts).sort((a, b) => b.count - a.count);
    
    // 상위 10개 색상 선택
    const topColors = sortedColors.slice(0, 10);
    
    // 색상을 RGB에서 HEX로 변환하는 함수
    const rgbToHex = (r, g, b) => {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    };
    
    // 가장 지배적인 색상과 가장 밝은 색상 찾기
    let dominantColor = { r: 0, g: 0, b: 0 };
    let brightestColor = { r: 255, g: 255, b: 255 };
    let accentColor = { r: 0, g: 0, b: 255 }; // 강조색 (기본 파란색)
    
    if (topColors.length > 0) {
      // 지배적인 색상 (가장 빈도가 높은 색상)
      const mainColor = topColors[0];
      
      // 원본 픽셀의 평균을 계산하여 더 정확한 색상 얻기
      if (mainColor.originalPixels.length > 0) {
        const sumR = mainColor.originalPixels.reduce((sum, p) => sum + p.r, 0);
        const sumG = mainColor.originalPixels.reduce((sum, p) => sum + p.g, 0);
        const sumB = mainColor.originalPixels.reduce((sum, p) => sum + p.b, 0);
        
        dominantColor = {
          r: Math.round(sumR / mainColor.originalPixels.length),
          g: Math.round(sumG / mainColor.originalPixels.length),
          b: Math.round(sumB / mainColor.originalPixels.length)
        };
      } else {
        dominantColor = { r: mainColor.r, g: mainColor.g, b: mainColor.b };
      }
      
      // 흰색이 지배적인 경우, 두 번째 색상을 메인으로 사용
      const isDominantWhite = dominantColor.r > 200 && dominantColor.g > 200 && dominantColor.b > 200;
      if (isDominantWhite && topColors.length > 1) {
        const secondColor = topColors[1];
        dominantColor = { r: secondColor.r, g: secondColor.g, b: secondColor.b };
      }
      
      // 강조색 찾기 (가장 채도가 높은 색상, 주로 파란색)
      for (const color of topColors) {
        const r = color.r;
        const g = color.g;
        const b = color.b;
        
        // 파란색 감지
        if (b > Math.max(r, g) * 1.2 && b > 100) {
          accentColor = { r, g, b };
          break;
        }
      }
    }
    
    // 결과 색상 설정: accentColor를 주 색상으로, 흰색을 보조 색상으로
    const colors = {
      color1: rgbToHex(accentColor.r, accentColor.g, accentColor.b),
      color2: '#FFFFFF'
    };
    
    return colors;
  };

  // 컨테이너에 맞게 스케일링
  useEffect(() => {
    if (containerRef.current && asciiRef.current && ascii) {
      const updateScale = () => {
        const containerWidth = containerRef.current?.offsetWidth;
        const containerHeight = containerRef.current?.offsetHeight;
        const textWidth = asciiRef.current?.scrollWidth;
        const textHeight = asciiRef.current?.scrollHeight;
        
        if (textWidth && textHeight) {
          let scale = 1;
          let displayWidth = width || 'auto';
          let displayHeight = height || 'auto';
          
          // 크기 모드에 따른 스케일링
          if (width === '100%' && height === 'auto') {
            // 너비에 맞추고 높이는 자동 조정
            scale = containerWidth / textWidth;
            displayHeight = `${textHeight * scale}px`;
          } else if (typeof width === 'number' && height === 'auto') {
            // 고정된 너비, 자동 높이
            scale = width / textWidth;
            displayHeight = `${textHeight * scale}px`;
          } else if (width === '100%' && typeof height === 'number') {
            // 가득 찬 너비, 고정된 높이
            const widthScale = containerWidth / textWidth;
            const heightScale = height / textHeight;
            scale = Math.min(widthScale, heightScale);
          } else if (typeof width === 'number' && typeof height === 'number') {
            // 고정된 크기
            const widthScale = width / textWidth;
            const heightScale = height / textHeight;
            scale = Math.min(widthScale, heightScale);
          }
          
          // 스케일 적용
          asciiRef.current.style.transform = `scale(${scale})`;
          asciiRef.current.style.transformOrigin = 'top left';
          
          // 컨테이너 크기 조정
          if (width === '100%') {
            containerRef.current.style.width = '100%';
          } else {
            containerRef.current.style.width = displayWidth;
          }
          
          containerRef.current.style.height = displayHeight;
        }
      };
      
      // ResizeObserver로 크기 변경 추적
      const resizeObserver = new ResizeObserver(updateScale);
      resizeObserver.observe(containerRef.current);
      resizeObserver.observe(asciiRef.current);
      
      // 초기 스케일링
      updateScale();
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [ascii, width, height]);

  // 출력 마크업 생성
  const textStyle = {
    fontFamily: font.fontFamily || 'monospace',
    fontSize: font.fontSize || '10px',
    lineHeight: font.lineHeight || 1,
    whiteSpace: 'pre',
    color: 'transparent',
    backgroundImage: maskCanvasRef.current ? `url(${maskCanvasRef.current.toDataURL()})` : 'none',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
    imageRendering: 'pixelated',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    userSelect: 'none'
  };

  // characterSets prop 유효성 검사
  useEffect(() => {
    if (characterSets !== null) {
      if (typeof characterSets !== 'object') {
        console.error('[ASCII] characterSets prop must be an object or null');
      } else if (Object.keys(characterSets).length === 0) {
        console.warn('[ASCII] characterSets prop is empty object');
      }
    }
  }, [characterSets]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: width, 
        height: height,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      aria-label={alt || '이미지의 ASCII 아트 표현'}
    >
      {error ? (
        <div className="ascii-error">{error}</div>
      ) : (
        <div
          ref={asciiRef}
          className="ascii-art"
          style={textStyle}
          aria-label={alt}
        >
          {ascii}
        </div>
      )}
    </div>
  );
};

export default AsciiImageGenerator; 