// pages/index.js
import Meta from "../components/Meta";
import AsciiImageGenerator from "../components/AsciiImageGenerator";

export async function getStaticProps() {
  // 여기에 필요한 데이터를 서버에서 가져오거나 정의합니다.
  const pageProps = {
    title: "DWMM",
    content: "Design What Matters Mosst | 장승환"
  };

  // 이 객체가 MyApp 컴포넌트로 전달됩니다.
  return {
    props: pageProps
  };
}

const CUSTOM_CHARACTER_SETS = {
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'.',
  standard: '@%#*+=-:.',
  blocks: '█▓▒░ ',
  myCustomSet: '※☆★○●◎◇◆□■△▲▽▼→←↑↓↔↕◁▷◀▶♤♠♡♥♧♣⊙◈▣◐◑▒▤▥▨▧▦▩♨☏☎☜☞♂♀☎✂«»¶†‡↕↗↙↖↘♬®©™&@#$',
  simple: '.:-=+*#%@',
  // 다른 커스텀 문자 세트들 추가 가능
};

function Home({ title, description }) {
  return (
    <div>
      <Meta title={title} description={description} />
      <main>
        <section className="home">          
          <div className="ascii-showcase">
            <h3>ASCII 아트 생성기</h3>
            <AsciiImageGenerator 
              imageUrl="https://lqrkuvemtnnnjgvptnlo.supabase.co/storage/v1/object/public/assets/blog/8-things-keep-in-mind-as-b2b-product-designer-2/header_img.png" 
              alt="샘플 이미지의 ASCII 아트"
              width="100%" 
              height={400}
              color1="#2962ff"
              color2="#FFFFFF"
              enableJitter={true}
              jitterInterval={120}
              enableGlow={true}
              glowRadius={8}
              glowColor="#4fc3f7"
              enableTransparency={true}
              contrast={1.4}
              brightness={1.2}
              extractColors={true}
              transparencyThreshold={0.75}
              invertTransparency={false}
              characterSets="blocks"
            />
            <p className="ascii-info">마우스를 위 영역에 올려보세요!</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
