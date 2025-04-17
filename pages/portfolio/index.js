// pages/index.js
import Meta from "../../components/Meta";

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

function Home({ title, description }) {
  return (
    <div>
      <Meta title={title} description={description} />
      <main>
        <section className="home">
          <h2>안녕하세요 장승환입니다.</h2>
          <p>이곳은 홈 페이지입니다.</p>
        </section>
      </main>
    </div>
  );
}

export default Home;
