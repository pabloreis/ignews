import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';
import styles from './styles.module.scss';
import {
  PrismicPublicationCategories,
  PrismicTypes,
} from '../../models/PrismicModel';

interface PostResponse {
  uid: string;
  data: {
    title: string;
    content: Array<Record<'type' | 'paragraph' | 'text', string>>;
  };
  last_publication_date: string;
}

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  updatedAt: string;
};

interface PostsProps {
  posts: Post[];
}

export default function Posts({ posts }: PostsProps) {
  return (
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(({ slug, title, excerpt, updatedAt }) => (
            <a href="#" key={slug}>
              <time>{updatedAt}</time>
              <strong>{title}</strong>
              <p>{excerpt}</p>
            </a>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', PrismicTypes.Publication)],
    {
      fetch: [
        PrismicPublicationCategories.Title,
        PrismicPublicationCategories.Content,
      ],
      pageSize: 100,
    }
  );

  const posts = (response.results as PostResponse[]).map((post) => ({
    slug: post.uid,
    title: RichText.asText(post.data.title),
    excerpt:
      post.data.content.find((content) => content.type === 'paragraph')?.text ??
      '',
    updatedAt: new Date(post.last_publication_date).toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    ),
  }));

  return {
    props: {
      posts,
    },
  };
};
