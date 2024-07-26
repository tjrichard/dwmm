// components/meta.js
import Head from 'next/head';

const Meta = ({ title, description }) => (
  <Head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    {/* 추가적인 메타 태그나 링크 삽입 가능 */}
  </Head>
);

export default Meta;
