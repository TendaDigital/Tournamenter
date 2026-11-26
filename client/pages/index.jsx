import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Alert } from '../components/Controls';
import { Layout, Teams, Groups, Login, LiveMatch } from '../components/Administration';
import { useData } from '../lib/data';

const Tables = dynamic(() => import('../components/Tables'));
const Views = dynamic(() => import('../components/Views'));
const Display = dynamic(() => import('../components/Display'), { ssr: false });
const ViewList = dynamic(() => import('../components/Display').then((m) => m.ViewList));

export default function Tournamenter() {
  const [path, setPath] = useState(null);
  const { data: ui, error } = useData('/api/ui');
  useEffect(() => {
    setPath(window.location.pathname);
  }, []);
  if (!path || !ui) return <Alert>{error}</Alert>;
  const [, collection, action, rawId] = path.split('/');
  const id = rawId ? decodeURIComponent(rawId) : null;
  const title = (
    <Head>
      <title>{ui.appName}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
  );
  if (collection === 'views' && action === 'view')
    return (
      <>
        {title}
        {id ? <Display id={id} name={ui.appName} extensions={ui.pageViews} /> : <ViewList />}
      </>
    );
  let page;
  switch (collection) {
    case 'login':
      page = <Login name={ui.appName} />;
      break;
    case 'groups':
      page = <Groups />;
      break;
    case 'tables':
      page = <Tables id={id} methods={ui.evaluateMethodsNames} />;
      break;
    case 'views':
      page = <Views id={id} extensions={ui.pageViews} />;
      break;
    case 'matches':
      page = <LiveMatch id={id} />;
      break;
    default:
      page = <Teams />;
  }
  return (
    <>
      {title}
      <Layout ui={ui} path={path}>
        {page}
      </Layout>
    </>
  );
}
