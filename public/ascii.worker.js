// public/ascii.worker.js

// --- 유틸리티 함수 ---
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// --- SeededRandom 클래스 ---
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

// --- 기본 문자 세트 ---
const DEFAULT_CHARACTER_SETS = {
  blocks: '█▓▒░ ',
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'.',
  standard: '@%#*+=-:.',
  binary: '01',
  hex: '0123456789ABCDEF',
  // 메인 스레드에서 characterSets 객체를 전달받으면 이 기본값 대신 사용됩니다.
  // 예시: 사용자 정의 세트도 여기에 추가할 수 있지만, 메인 스레드와 동기화 필요
  simple: '.:-=+*#%@',
  b2b: 'b2design' // 예시로 추가
};


/**
 * ImageData로부터 픽셀 데이터를 추출하는 함수 (Worker 용)
 */
const extractPixelDataFromImageData = (imageData, props, seed, fontAspectRatio) => {
  const {
    brightness: brightVal = 0,
    contrast: contrastVal = 0,
    invertColors: invertEnabled = false,
    enableJitter = false,
  } = props;

  const contrastFactor = 259 * (contrastVal + 255) / (255 * (259 - contrastVal));
  // imageData 객체에서 직접 너비/높이 및 데이터 사용
  const { data, width: asciiWidth, height: asciiHeight } = imageData;
  const pixelData = [];
  const rng = enableJitter ? new SeededRandom(seed) : null;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    // const alpha = data[i + 3]; // 알파값 필요시 사용

    if (invertEnabled) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    r = clamp(contrastFactor * (r - 128) + 128 + brightVal, 0, 255);
    g = clamp(contrastFactor * (g - 128) + 128 + brightVal, 0, 255);
    b = clamp(contrastFactor * (b - 128) + 128 + brightVal, 0, 255);

    let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // 0 ~ 1 범위

    if (enableJitter && rng) {
      const noise = (rng.next() - 0.5) * 0.1; // 노이즈 강도 조절 가능 (-0.05 ~ +0.05)
      brightness = clamp(brightness + noise, 0, 1);
    }

    pixelData.push({ r, g, b, brightness });
  }

  // 추출된 픽셀 데이터와 계산된 ASCII 크기 반환
  return { pixelData, asciiWidth, asciiHeight };
};

/**
 * 픽셀 데이터를 기반으로 ASCII 문자 데이터 배열 생성 (Worker 용)
 */
const generateAsciiData = (pixelData, asciiWidth, asciiHeight, props) => {
   const {
    characterSet = 'detailed', // 사용할 문자 세트 이름
    customCharacterSet,        // 사용자 정의 문자 세트 문자열
    characterSets,             // 메인 스레드에서 전달받은 전체 세트 객체
  } = props;

  // 메인 스레드에서 characterSets 객체를 전달받았는지, 유효한 객체인지 확인
  const effectiveCharacterSets = characterSets && typeof characterSets === 'object' && Object.keys(characterSets).length > 0
      ? characterSets
      : DEFAULT_CHARACTER_SETS; // 전달받지 못했거나 비어있으면 Worker 내부 기본값 사용

  let gradient; // 사용할 최종 문자 세트 문자열

  if (characterSet === 'custom') {
    // customCharacterSet이 유효한 문자열인지 확인 후 사용, 아니면 공백 fallback
    gradient = typeof customCharacterSet === 'string' && customCharacterSet.length > 0 ? customCharacterSet : ' ';
  } else {
    // effectiveCharacterSets에서 characterSet 이름으로 찾기
    gradient = effectiveCharacterSets[characterSet];
    // 만약 해당 이름의 세트가 없다면, 'detailed' 세트 사용 시도
    if (!gradient) {
        gradient = effectiveCharacterSets.detailed;
    }
    // 그래도 없다면 (매우 예외적), 최종 fallback으로 기본 detailed 사용
    if (!gradient) {
        console.warn(`[Worker] Character set "${characterSet}" and fallback "detailed" not found. Using default detailed.`);
        gradient = DEFAULT_CHARACTER_SETS.detailed;
    }
  }

  // gradient가 최종적으로 유효한 문자열인지 마지막으로 확인
  if (typeof gradient !== 'string' || gradient.length === 0) {
    console.error('[Worker] Failed to determine a valid character set gradient. Using fallback "."');
    gradient = '.'; // 최소한의 fallback
  }

  const nLevels = gradient.length; // 문자 세트의 길이 (밝기 레벨 수)
  const asciiData = []; // 결과를 담을 배열

  // 각 픽셀 위치(y, x)를 순회
  for (let y = 0; y < asciiHeight; y++) {
    for (let x = 0; x < asciiWidth; x++) {
      const index = y * asciiWidth + x; // 1차원 배열 인덱스 계산
      // pixelData 배열 범위를 벗어나는 접근 방지
      if (index >= pixelData.length) continue;

      const pixel = pixelData[index]; // 해당 위치의 픽셀 정보 (r, g, b, brightness)
      // 밝기 값(0~1)을 안전하게 범위 내로 제한
      const clampedBrightness = clamp(pixel.brightness, 0, 1);
      // 밝기 값을 문자 세트 인덱스(0 ~ nLevels-1)로 매핑 (반올림)
      let charIndex = Math.round(clampedBrightness * (nLevels - 1));
      // 계산된 인덱스가 유효한 범위 내에 있는지 다시 확인 (반올림으로 인해 벗어날 수 있음)
      charIndex = clamp(charIndex, 0, nLevels - 1);

      const char = gradient.charAt(charIndex); // 해당 인덱스의 문자 선택
      // 픽셀의 RGB 값을 사용하여 CSS 색상 문자열 생성
      const color = `rgb(${Math.round(pixel.r)}, ${Math.round(pixel.g)}, ${Math.round(pixel.b)})`;

      // Canvas 렌더링에 필요한 정보만 포함하여 결과 배열에 추가
      asciiData.push({ char, color, x, y });
    }
  }
  return asciiData; // 생성된 ASCII 데이터 배열 반환
};

// --- Worker 메시지 핸들러 ---
self.onmessage = (event) => {
  // 메인 스레드로부터 전달받은 데이터 추출
  const { imageData, props, seed, fontAspectRatio } = event.data;

  // 데이터 유효성 검사: 필수 데이터 존재 여부 확인
  if (!imageData || typeof imageData.width !== 'number' || typeof imageData.height !== 'number' || !imageData.data) {
      self.postMessage({ error: '워커에 유효하지 않은 imageData가 전달되었습니다.' });
      return; // 작업 중단
  }
   if (!props) {
    self.postMessage({ error: '필수 데이터(props)가 워커로 전달되지 않았습니다.' });
    return; // 작업 중단
  }

  try {
    // console.log('[Worker] Received data, starting processing...'); // 디버깅 로그

    // 1. 이미지 데이터로부터 픽셀 정보(밝기 등) 추출
    const { pixelData, asciiWidth, asciiHeight } = extractPixelDataFromImageData(imageData, props, seed, fontAspectRatio);

    // 픽셀 데이터 추출 결과 유효성 검사
    if (!pixelData || pixelData.length === 0) {
        throw new Error(`픽셀 데이터 추출 실패 또는 빈 데이터 반환 (imageData: ${imageData.width}x${imageData.height})`);
    }
    // console.log(`[Worker] Pixel data extracted: ${pixelData.length} pixels`); // 디버깅 로그

    // 2. 추출된 픽셀 데이터를 기반으로 ASCII 문자 및 색상 데이터 생성
    const asciiData = generateAsciiData(pixelData, asciiWidth, asciiHeight, props);
    // console.log(`[Worker] ASCII data generated: ${asciiData.length} characters`); // 디버깅 로그

    // 3. 성공적으로 생성된 ASCII 데이터를 메인 스레드로 전송
    // console.log('[Worker] Posting results back to main thread.'); // 디버깅 로그
    self.postMessage({ asciiData, asciiWidth, asciiHeight });

  } catch (error) {
    // 작업 중 발생한 오류 처리
    console.error('[Worker] Error during processing:', error); // 오류 객체 로깅
    console.error('[Worker] Error stack:', error.stack); // 스택 추적 로깅
    // 오류 정보를 메인 스레드로 전송
    self.postMessage({
        error: `Worker 처리 오류: ${error.message}`, // 오류 메시지 전달
        // stack: error.stack // 필요시 스택 정보 전달 (디버깅용, 보안 주의)
    });
  }
};

// --- Worker 전역 오류 핸들러 ---
// self.onmessage 내에서 처리되지 않거나 Worker 스크립트 로딩 자체의 오류 처리
self.onerror = (event) => {
  console.error('[Worker Global Error] Event:', event); // 전체 이벤트 객체 로깅
  // 오류 이벤트 객체에서 유용한 정보 추출 및 로깅
  console.error(`[Worker Global Error] Message: ${event.message}`); // 오류 메시지
  console.error(`[Worker Global Error] Filename: ${event.filename}`); // 오류 발생 파일
  console.error(`[Worker Global Error] Lineno: ${event.lineno}`); // 오류 발생 라인 번호
  // 오류 정보를 메인 스레드로 전송 (선택적)
  self.postMessage({
      error: `Worker 전역 오류: ${event.message || '알 수 없는 오류'} (line: ${event.lineno})`
  });
  // return true; // 기본 오류 처리를 막고 싶을 경우 true 반환
};

// Worker 스크립트 로딩 완료 시 로그 (디버깅용)
console.log('[Worker] Script loaded and ready.');