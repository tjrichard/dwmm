import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';

// ASCII 문자 관련 상수
const ASCII_CONSTANTS = {
  DEFAULT_CHAR_WIDTH: 4,
  DEFAULT_CHAR_HEIGHT: 8,
  DEFAULT_CHAR_ASPECT_RATIO: 0.6,
  MIN_BRIGHTNESS: 0,
  MAX_BRIGHTNESS: 1
};

// 유틸리티 함수들
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
  // 높이가 0인 경우 에러 방지
  return height === 0 ? ASCII_CONSTANTS.DEFAULT_CHAR_ASPECT_RATIO : width / height;
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
 * 이미지에서 픽셀 데이터를 추출하는 함수 (jitter 효과 반영)
 * @param {HTMLImageElement} img - 원본 이미지 요소
 * @param {object} props - 컴포넌트 속성
 * @param {HTMLCanvasElement} canvas - 오프스크린 캔버스
 * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
 * @param {number} seed - Jitter 효과를 위한 랜덤 시드
 * @returns {object} - { pixelData: [{r, g, b, brightness}], asciiWidth, asciiHeight }
 */
const extractPixelData = (img, props, canvas, ctx, seed) => {
  const {
    outputWidth,
    brightness: brightVal = 0,
    contrast: contrastVal = 0,
    blur: blurValue = 0,
    invertColors: invertEnabled = false,
    font = {},
    enableJitter = false,
  } = props;

  const contrastFactor = 259 * (contrastVal + 255) / (255 * (259 - contrastVal));
  const fontAspectRatio = measureFontAspectRatio(font);
  const asciiWidth = outputWidth > 0 ? outputWidth : 100;
  const asciiHeight = Math.max(1, Math.round(img.height / img.width * asciiWidth * fontAspectRatio));

  canvas.width = Math.max(1, asciiWidth);
  canvas.height = Math.max(1, asciiHeight);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = blurValue > 0 ? `blur(${blurValue}px)` : 'none';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const pixelData = [];
  const rng = new SeededRandom(seed);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (invertEnabled) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
    }

    r = clamp(contrastFactor * (r - 128) + 128 + brightVal, 0, 255);
    g = clamp(contrastFactor * (g - 128) + 128 + brightVal, 0, 255);
    b = clamp(contrastFactor * (b - 128) + 128 + brightVal, 0, 255);

    let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    if (enableJitter) {
      const noise = (rng.next() - 0.5) * 0.1;
      brightness = clamp(brightness + noise, 0, 1);
    }

    pixelData.push({ r, g, b, brightness });
  }

  return { pixelData, asciiWidth: canvas.width, asciiHeight: canvas.height };
};

/**
 * 픽셀 데이터를 기반으로 ASCII 문자 데이터 배열 생성
 * @param {Array} pixelData - 픽셀 데이터 배열 [{r, g, b, brightness}]
 * @param {number} asciiWidth - ASCII 아트 너비
 * @param {number} asciiHeight - ASCII 아트 높이
 * @param {object} props - 컴포넌트 속성
 * @returns {Array} - [{ char, color, x, y, key }] 형태의 문자 데이터 배열
 */
const generateAsciiData = (pixelData, asciiWidth, asciiHeight, props) => {
  const {
    characterSet = 'detailed',
    customCharacterSet,
    characterSets,
  } = props;

  const effectiveCharacterSets = characterSets && typeof characterSets === 'object' ? characterSets : DEFAULT_CHARACTER_SETS;
  let gradient;

  if (characterSet === 'custom') {
    gradient = typeof customCharacterSet === 'string' && customCharacterSet.length > 0 ? customCharacterSet : ' ';
  } else {
    gradient = effectiveCharacterSets[characterSet] || DEFAULT_CHARACTER_SETS.detailed;
  }

  if (typeof gradient !== 'string' || gradient.length === 0) {
    console.warn(`[ASCII] Invalid gradient for charset "${characterSet}", falling back to detailed.`);
    gradient = DEFAULT_CHARACTER_SETS.detailed;
  }

  const nLevels = gradient.length;
  const asciiData = [];

  for (let y = 0; y < asciiHeight; y++) {
    for (let x = 0; x < asciiWidth; x++) {
      const index = y * asciiWidth + x;
      if (index >= pixelData.length) continue;

      const pixel = pixelData[index];

      const clampedBrightness = clamp(pixel.brightness, 0, 1);
      let charIndex = Math.round(clampedBrightness * (nLevels - 1));
      charIndex = clamp(charIndex, 0, nLevels - 1);

      const char = gradient.charAt(charIndex);

      const color = `rgb(${Math.round(pixel.r)}, ${Math.round(pixel.g)}, ${Math.round(pixel.b)})`;

      asciiData.push({ char, color, x, y, key: `${x}-${y}` });
    }
  }

  return asciiData;
};

/**
 * AsciiImageGenerator 컴포넌트 (Web Worker 및 Canvas 렌더링 적용)
 */
const AsciiImageGeneratorComponent = ({
  imageUrl,
  alt = '',
  characterSet = 'detailed',
  customCharacterSet = '',
  invertColors = false,
  blur = 0,
  brightness = 0,
  contrast = 0,
  width = '100%',
  height = 'auto',
  outputWidth = 100,
  characterSets = null, // Worker로 전달됨
  font = {
    fontFamily: '"Fragment Mono", monospace',
    fontSize: '10px',
    lineHeight: 1,
    fontWeight: 'normal',
    letterSpacing: 'normal'
  },
  enableJitter = false,
  jitterInterval = 100
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null); // 화면에 표시될 Canvas
  const offscreenCanvasRef = useRef(null); // 이미지 처리를 위한 오프스크린 Canvas
  const workerRef = useRef(null);
  const rngSeedRef = useRef(Math.random());
  const jitterIntervalRef = useRef(null);
  const lastDrawnDataRef = useRef(null); // 마지막으로 그린 데이터 참조
  const fontLoadInitiatedRef = useRef(false); // 폰트 로드 시작 여부

  const [img, setImg] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFontReady, setIsFontReady] = useState(false); // 폰트 로딩 상태
  const [workerError, setWorkerError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('이미지 로딩 중...'); // 상태 메시지
  const [asciiResult, setAsciiResult] = useState({ data: [], width: 0, height: 0 }); // Worker 결과 저장

  // 1. 폰트 로딩 상태 확인
  useEffect(() => {
    if (!font.fontFamily || fontLoadInitiatedRef.current) return;

    fontLoadInitiatedRef.current = true;
    setStatusMessage('폰트 로딩 중...');
    document.fonts.load(`1em ${font.fontFamily}`).then(() => {
      // console.log('Font loaded:', font.fontFamily);
      setIsFontReady(true);
      setStatusMessage('폰트 로드 완료');
    }).catch(err => {
      console.error('Font loading error:', err);
      // 폰트 로딩 실패 시 대체 폰트 사용 또는 에러 처리
      setIsFontReady(true); // 일단 진행하도록 설정 (기본 폰트 사용)
      setStatusMessage('폰트 로딩 실패, 기본 폰트로 진행');
    });
  }, [font.fontFamily]);

  // 2. 이미지 로딩
  useEffect(() => {
    setImageLoaded(false);
    setAsciiResult({ data: [], width: 0, height: 0 }); // 이미지 변경 시 초기화
    setWorkerError(null);
    setStatusMessage('이미지 URL 분석 중...');

    if (imageUrl) {
      setStatusMessage('이미지 로딩 중...');
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        setImg(image);
        setImageLoaded(true);
        setStatusMessage('이미지 로드 완료');
      };
      image.onerror = (err) => {
        console.error("Image loading error:", err);
        setWorkerError('이미지를 로드할 수 없습니다.');
        setStatusMessage('이미지 로드 실패');
        setImg(null);
        setImageLoaded(false);
      };
      image.src = imageUrl;

      return () => {
        image.onload = null;
        image.onerror = null;
      };
    } else {
      setStatusMessage('이미지 URL이 제공되지 않았습니다.');
      setWorkerError(null);
      setImg(null);
      setImageLoaded(false);
    }
  }, [imageUrl]);

  // 3. Web Worker 초기화 및 메시지 핸들러 설정
  useEffect(() => {
    workerRef.current = new Worker('/ascii.worker.js');
    setStatusMessage('Worker 초기화 중...');

    workerRef.current.onmessage = (event) => {
      if (event.data.error) {
        console.error('[Worker Error]', event.data.error);
        setWorkerError(event.data.error);
        setStatusMessage('ASCII 생성 오류');
        setAsciiResult({ data: [], width: 0, height: 0 }); // 에러 시 결과 초기화
      } else {
        const { asciiData, asciiWidth, asciiHeight } = event.data;
        setAsciiResult({ data: asciiData, width: asciiWidth, height: asciiHeight });
        setWorkerError(null);
        // 상태 메시지는 Canvas 그리기 단계에서 업데이트
      }
    };

    workerRef.current.onerror = (errorEvent) => {
      // ErrorEvent 객체의 상세 정보 로깅
      console.error('Unhandled Worker Error Event:', errorEvent);
      console.error(`Error Message: ${errorEvent.message}`);
      console.error(`Error Filename: ${errorEvent.filename}`);
      console.error(`Error Lineno: ${errorEvent.lineno}`);
      // errorEvent.error 속성에 실제 오류 객체가 포함될 수 있음 (브라우저마다 다름)
      if (errorEvent.error) {
          console.error('Actual Error Object (if available):', errorEvent.error);
          console.error('Actual Error Stack:', errorEvent.error?.stack);
      }

      setWorkerError(`Worker 오류 발생: ${errorEvent.message || '알 수 없는 오류'}`);
      setStatusMessage('Worker 오류');
      setAsciiResult({ data: [], width: 0, height: 0 });
    };

    setStatusMessage('Worker 준비 완료');

    // 컴포넌트 언마운트 시 Worker 종료
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        // console.log('Worker terminated');
      }
    };
  }, []); // 마운트 시 한 번만 실행

  // 4. 이미지/폰트 로드 완료 및 설정 변경 시 Worker 작업 요청
  const triggerAsciiGeneration = useCallback((showStatus = true) => {
    if (img && imageLoaded && isFontReady && workerRef.current) {
      // 상태 메시지 표시 여부 확인
      if (showStatus) {
        setStatusMessage('ASCII 생성 준비 중...');
      }
      try {
        // 오프스크린 Canvas 준비
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        const offscreenCanvas = offscreenCanvasRef.current;
        // 컨텍스트 가져오기 전에 canvas 존재 여부 확인
        if (!offscreenCanvas) {
            throw new Error('오프스크린 Canvas 요소를 찾을 수 없습니다.');
        }
        const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

        if (!offscreenCtx) {
          throw new Error('오프스크린 Canvas 컨텍스트를 가져올 수 없습니다.');
        }

        // 폰트 종횡비 계산
        const fontAspectRatio = measureFontAspectRatio(font);
        const targetAsciiWidth = outputWidth > 0 ? outputWidth : 100;
        const targetAsciiHeight = Math.max(1, Math.round(img.height / img.width * targetAsciiWidth * fontAspectRatio));

        // 오프스크린 Canvas 크기 설정 및 이미지 그리기
        offscreenCanvas.width = targetAsciiWidth;
        offscreenCanvas.height = targetAsciiHeight;
        offscreenCtx.clearRect(0, 0, targetAsciiWidth, targetAsciiHeight);
        // 블러 효과는 오프스크린 Canvas에 적용해야 Worker에 전달됨
        offscreenCtx.filter = blur > 0 ? `blur(${blur}px)` : 'none';
        offscreenCtx.drawImage(img, 0, 0, targetAsciiWidth, targetAsciiHeight);

        const imageData = offscreenCtx.getImageData(0, 0, targetAsciiWidth, targetAsciiHeight);

        // Worker에 전달할 props 객체 생성
        const workerProps = {
          brightness,
          contrast,
          invertColors,
          enableJitter, // enableJitter는 Worker 내부에서도 사용될 수 있음
          characterSet,
          customCharacterSet,
          characterSets
        };
        const currentSeed = enableJitter ? rngSeedRef.current : Date.now();

        // 상태 메시지 표시 여부 확인
        if (showStatus) {
          setStatusMessage('ASCII 생성 중... (Worker)');
        }

        // Worker에 데이터 전송
        workerRef.current.postMessage(
          { imageData, props: workerProps, seed: currentSeed, fontAspectRatio },
          [imageData.data.buffer]
        );

      } catch (e) {
        console.error("Error preparing data for worker:", e);
        // 에러 발생 시 상태 메시지 업데이트
        setWorkerError("Worker 작업 요청 준비 중 오류 발생: " + e.message);
        setStatusMessage('오류 발생 (Worker 준비)');
      }
    }
  }, [
    img, imageLoaded, isFontReady,
    outputWidth, brightness, contrast, blur, invertColors, font,
    enableJitter, characterSet, customCharacterSet, characterSets
    // 의존성 배열에 status 업데이트 함수는 포함하지 않음
  ]);

  // 주요 의존성 변경 시 ASCII 생성 트리거 (상태 메시지 표시)
  useEffect(() => {
    if (imageLoaded && isFontReady) {
      // 첫 로드 또는 prop 변경 시에는 상태 메시지 표시 (기본값 true 사용)
      triggerAsciiGeneration();
    }
    // triggerAsciiGeneration 함수 자체가 의존성으로 포함됨
  }, [imageLoaded, isFontReady, triggerAsciiGeneration]);

  // 5. Jitter 효과 처리
  useEffect(() => {
    if (jitterIntervalRef.current) {
      clearInterval(jitterIntervalRef.current);
      jitterIntervalRef.current = null;
    }

    if (enableJitter && jitterInterval > 0 && imageLoaded && isFontReady) {
      jitterIntervalRef.current = setInterval(() => {
        rngSeedRef.current = Math.random();
        // Jitter 업데이트 시에는 상태 메시지 표시 안 함 (false 전달)
        triggerAsciiGeneration(false);
      }, jitterInterval);
    }

    return () => {
      if (jitterIntervalRef.current) {
        clearInterval(jitterIntervalRef.current);
        jitterIntervalRef.current = null;
      }
    };
    // triggerAsciiGeneration 함수 자체가 의존성으로 포함됨
  }, [enableJitter, jitterInterval, imageLoaded, isFontReady, triggerAsciiGeneration]);

  // 6. Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const { data: asciiData, width: asciiWidth, height: asciiHeight } = asciiResult;

    // 그리기 조건 확인
    if (!canvas || !container || !asciiData || asciiData.length === 0 || !asciiWidth || !asciiHeight || !isFontReady) {
        // 그릴 준비가 안 됐거나 데이터가 없으면 클리어 또는 상태 메시지 표시
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // 컨테이너 크기에 맞춰 캔버스 크기 조정 (스타일과 별개)
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        // console.log('Canvas rendering skipped: Not ready or no data.');
        return;
    }

    // 마지막으로 그린 데이터와 동일하면 다시 그리지 않음 (최적화)
    if (lastDrawnDataRef.current === asciiData) {
        // console.log('Canvas rendering skipped: Data unchanged.');
        return;
    }

    setStatusMessage('Canvas 렌더링 중...');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for rendering canvas.');
      setStatusMessage('Canvas 컨텍스트 오류');
      return;
    }

    // 폰트 속성 설정
    ctx.font = `${font.fontWeight || 'normal'} ${font.fontSize || '10px'} ${font.fontFamily || 'monospace'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 문자 크기 및 간격 계산
    const fontSizePx = parseFloat(font.fontSize || '10px');
    const fontAspectRatio = measureFontAspectRatio(font);
    const charWidth = fontSizePx * fontAspectRatio;
    // lineHeight 적용 방법: 각 줄의 y 위치 계산 시 사용하거나, 
    // textBaseline='top'으로 하고 y 위치를 조정할 수 있음.
    // 여기서는 lineHeight를 직접 높이 계산에 사용 (가장 간단한 접근)
    const charHeight = fontSizePx * parseFloat(font.lineHeight || 1);

    // 총 ASCII 아트 크기 (스케일링 전)
    const totalWidth = asciiWidth * charWidth;
    const totalHeight = asciiHeight * charHeight;

    if (totalWidth <= 0 || totalHeight <= 0) {
        console.warn('Calculated zero dimensions for ASCII art.');
        return; // 그릴 수 없음
    }

    // 컨테이너 크기에 맞춰 Canvas 크기 설정 및 스케일 계산
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    let scale = 1;
    if (containerWidth > 0 && containerHeight > 0) {
      const scaleX = containerWidth / totalWidth;
      const scaleY = containerHeight / totalHeight;
      scale = Math.min(scaleX, scaleY); // Fit 모드
    }

    // Canvas 클리어 및 변환 설정 (중앙 정렬 및 스케일링)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); // 현재 상태 저장

    // 스케일링된 컨텐츠가 중앙에 오도록 이동
    const scaledWidth = totalWidth * scale;
    const scaledHeight = totalHeight * scale;
    const translateX = (containerWidth - scaledWidth) / 2;
    const translateY = (containerHeight - scaledHeight) / 2;

    ctx.translate(translateX, translateY);
    ctx.scale(scale, scale); // 스케일 적용

    // pixelated 렌더링 힌트 (선명하게 보일 수 있도록)
    ctx.imageSmoothingEnabled = false;

    // ASCII 데이터 순회하며 문자 그리기
    asciiData.forEach(item => {
      ctx.fillStyle = item.color;
      // 각 문자의 중심 좌표 계산 (스케일링 전 기준)
      const xPos = (item.x + 0.5) * charWidth;
      const yPos = (item.y + 0.5) * charHeight; // lineHeight 고려
      ctx.fillText(item.char, xPos, yPos);
    });

    ctx.restore(); // 이전 상태 복원 (변환 해제)
    lastDrawnDataRef.current = asciiData; // 마지막 그린 데이터 업데이트
    setStatusMessage('렌더링 완료');

  // asciiResult가 변경되거나, 컨테이너 크기가 변경되거나, 폰트 준비 상태가 변경될 때 재렌더링
  }, [asciiResult, font, isFontReady, containerRef.current?.offsetWidth, containerRef.current?.offsetHeight]);

  // 최종 렌더링
  return (
    <div
      ref={containerRef}
      style={{ width, height, overflow: 'hidden', position: 'relative', background: 'transparent' }}
      aria-label={alt || '이미지의 ASCII 아트 표현'}
      role="img"
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }} // 부모 div에 맞게 채움
        aria-hidden="true" // 실제 내용은 alt로 제공되므로 숨김
      />
      {/* 상태 메시지 또는 에러 메시지 표시 (선택적) */}
      {(workerError || statusMessage !== '렌더링 완료') && (
          <div style={{
              position: 'absolute',
              top: 0, left: 0,
              padding: '5px',
              background: 'rgba(0, 0, 0, 0.5)',
              color: workerError ? 'red' : 'white',
              fontSize: '12px',
              zIndex: 10
          }}>
              {workerError || statusMessage}
          </div>
      )}
    </div>
  );
};

// memo 적용 유지
const AsciiImageGenerator = memo(AsciiImageGeneratorComponent);

export default AsciiImageGenerator; 