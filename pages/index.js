// pages/index.js
import Meta from "../components/Meta";
import AsciiImageGenerator from "../components/AsciiImageGenerator";

export async function getStaticProps() {
  // 여기에 필요한 데이터를 서버에서 가져오거나 정의합니다.
  const pageProps = {
    title: "DWMM",
    // description prop은 Home 컴포넌트에서 받지만 Meta 컴포넌트에는 전달되지 않음.
    // content prop은 사용되지 않음.
    // description: "Design What Matters Most | 장승환"
  };

  // 이 객체가 MyApp 컴포넌트로 전달됩니다.
  return {
    props: pageProps
  };
}

// AsciiImageGenerator 컴포넌트로 전달될 문자 세트 객체
const CUSTOM_CHARACTER_SETS = {
  myCustomSet: '※☆★○●◎◇◆□■△▲▽▼→←↑↓↔↕◁▷◀▶♤♠♡♥♧♣⊙◈▣◐◑▒▤▥▨▧▦▩♨☏☎☜☞♂♀☎✂«»¶†‡↕↗↙↖↘♬®©™&@#$', // 사용 예시로 남겨둘 수 있음
  simple: '.:-=+*#%@',
  blocks: '█▓▒░ ',
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'.',
  standard: '@%#*+=-:.',
  binary: '01',
  hex: '0123456789ABCDEF',
  b2b: 'b2design'
};

// Home 컴포넌트는 title prop만 받음 (getStaticProps에서 description 제거)
function Home({ title }) {
  return (
    <div>
      {/* Meta 컴포넌트에는 description prop이 없으므로 전달 제거 */}
      <Meta title={title} />
      <main>
        <section className="home">
          <div className="ascii-showcase">
            <AsciiImageGenerator
              imageUrl="https://cdn3d.iconscout.com/3d/premium/preview/file-folder-3d-icon-download-in-png-blend-fbx-gltf-formats--document-directory-archive-business-pack-management-icons-7651483.png"
              alt="샘플 이미지의 ASCII 아트"
              width="100%" // 컨테이너 너비에 맞춤
              height="100%"
              enableJitter={true}
              jitterInterval={120} // ms 단위
              contrast={1.4}
              brightness={1.2}
              characterSets={CUSTOM_CHARACTER_SETS}
              characterSet="b2b"
              outputWidth={100}
              font={{
                fontFamily: 'source-code-pro, monospace',
                fontSize: '12px',
                lineHeight: 1,
                fontWeight: 'normal',
                letterSpacing: 'normal'
              }}
              blur={0}
              invertColors={false}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
